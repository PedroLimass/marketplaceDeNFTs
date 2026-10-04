import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client'

import { SeenWindow } from './dedupe'
import { envelopeSchema, type RealtimeEnvelope } from './envelope'

export type RealtimeHandler = (event: RealtimeEnvelope) => void
export type ConnectionState = 'disconnected' | 'connecting' | 'connected'

type SocketFactory = (
  url: string,
  options: Partial<ManagerOptions & SocketOptions>,
) => Pick<Socket, 'on' | 'onAny' | 'off' | 'offAny' | 'removeAllListeners' | 'disconnect'>

export interface RealtimeClientOptions {
  url: string
  /** Substituível nos testes; por padrão usa o `socket.io-client`. */
  createSocket?: SocketFactory
  /** Quantos `event_id` lembrar para descartar repetições. */
  dedupeWindow?: number
}

export interface RealtimeIdentity {
  token: string | null
  userId: string | null
}

/**
 * Cliente de tempo real genérico: conecta, valida o envelope, descarta repetições e eventos
 * privados de outro usuário e entrega o resto aos handlers registrados por tipo. Não conhece
 * features; quem decide o que fazer com o evento (e se ele é antigo demais) é cada handler.
 */
export function createRealtimeClient({
  url,
  createSocket = io,
  dedupeWindow = 500,
}: RealtimeClientOptions) {
  const handlers = new Map<string, Set<RealtimeHandler>>()
  const reconnectListeners = new Set<() => void>()
  const stateListeners = new Set<() => void>()
  const seen = new SeenWindow(dedupeWindow)

  let socket: ReturnType<SocketFactory> | undefined
  let identity: RealtimeIdentity | undefined
  let state: ConnectionState = 'disconnected'
  let connectCount = 0

  const setState = (next: ConnectionState) => {
    if (state === next) return
    state = next
    stateListeners.forEach((listener) => {
      listener()
    })
  }

  const dispatch = (_type: string, payload: unknown) => {
    const parsed = envelopeSchema.safeParse(payload)
    if (!parsed.success) return

    const event = parsed.data
    if (!seen.markNew(event.event_id)) return
    // Eventos privados de outro usuário nunca chegam aos handlers.
    if (event.user_id !== undefined && event.user_id !== identity?.userId) return

    handlers.get(event.type)?.forEach((handler) => {
      handler(event)
    })
  }

  const teardown = () => {
    if (!socket) return
    socket.removeAllListeners()
    socket.offAny()
    socket.disconnect()
    socket = undefined
  }

  return {
    /** Conecta com a identidade dada. Repetir a mesma identidade não faz nada. */
    connect(next: RealtimeIdentity): void {
      if (socket && identity?.token === next.token && identity.userId === next.userId) return

      teardown()
      seen.clear()
      connectCount = 0
      identity = next
      setState('connecting')

      const created = createSocket(url, {
        transports: ['websocket'],
        auth: next.token ? { token: next.token } : {},
      })
      socket = created

      created.on('connect', () => {
        connectCount += 1
        setState('connected')
        // O segundo `connect` é uma reconexão: o que se perdeu no intervalo vem do REST.
        if (connectCount > 1) {
          reconnectListeners.forEach((listener) => {
            listener()
          })
        }
      })
      created.on('disconnect', () => {
        setState('connecting')
      })
      created.onAny(dispatch)
    },

    /** Desconecta, remove os ouvintes do socket e esquece a identidade. Os handlers ficam registrados. */
    disconnect(): void {
      teardown()
      seen.clear()
      identity = undefined
      connectCount = 0
      setState('disconnected')
    },

    subscribe(type: string, handler: RealtimeHandler): () => void {
      const set = handlers.get(type) ?? new Set<RealtimeHandler>()
      set.add(handler)
      handlers.set(type, set)
      return () => {
        set.delete(handler)
      }
    },

    onReconnect(listener: () => void): () => void {
      reconnectListeners.add(listener)
      return () => {
        reconnectListeners.delete(listener)
      }
    },

    getState: (): ConnectionState => state,

    onStateChange(listener: () => void): () => void {
      stateListeners.add(listener)
      return () => {
        stateListeners.delete(listener)
      }
    },
  }
}

export type RealtimeClient = ReturnType<typeof createRealtimeClient>
