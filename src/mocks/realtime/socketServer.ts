import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import { authenticate } from '../lib/session'
import { nftEnvelope, orderEnvelope, type MockEnvelope } from './envelopes'
import { subscribe, type DomainEvent } from './bus'

/**
 * Servidor Socket.IO do mock, sobre a API de WebSocket do MSW. Limitações (documentadas no
 * ARCHITECTURE.md): só existe no navegador, exige `transports: ['websocket']` (sem long polling)
 * e vive na mesma aba que o app, então não há outro processo "do servidor" para falhar.
 */

/**
 * O MSW compara a URL do WebSocket inclusive com a query (`?EIO=4&transport=websocket`), então
 * nenhum padrão com caminho casa com o Socket.IO. Por isso o link pega todas as conexões e o
 * filtro por caminho é feito no handler; as demais (como o HMR do Vite) seguem para o servidor real.
 */
export const socketLink = ws.link('*')
const SOCKET_PATH = '/socket.io/'

const PING_INTERVAL_MS = 25_000

interface Connection {
  userId: string | null
  send: (envelope: MockEnvelope) => void
  close: () => void
}

const connections = new Set<Connection>()
let lastEnvelope: MockEnvelope | undefined

/** Identifica o usuário pelo token enviado no pacote CONNECT do Socket.IO (`40{"token":"..."}`). */
function userIdFromConnectPacket(raw: string): string | null {
  const payload = raw.slice(2)
  if (!payload.startsWith('{')) return null

  try {
    const parsed = JSON.parse(payload) as { token?: unknown }
    if (typeof parsed.token !== 'string') return null

    const result = authenticate(
      new Request('http://mock.local', { headers: { Authorization: `Bearer ${parsed.token}` } }),
    )
    return result.authenticated ? result.user.id : null
  } catch {
    return null
  }
}

function deliver(envelope: MockEnvelope): void {
  lastEnvelope = envelope
  for (const connection of connections) {
    if (envelope.user_id === undefined || envelope.user_id === connection.userId) {
      connection.send(envelope)
    }
  }
}

function onDomainEvent(event: DomainEvent): void {
  const envelope = event.kind === 'nft' ? nftEnvelope(event.nftId) : orderEnvelope(event.orderId)
  if (envelope) deliver(envelope)
}

export const socketHandlers = [
  socketLink.addEventListener('connection', (raw) => {
    if (!new URL(raw.client.url).pathname.startsWith(SOCKET_PATH)) {
      raw.server.connect()
      return
    }

    const io = toSocketIo(raw)
    const connection: Connection = {
      userId: null,
      send: (envelope) => {
        io.client.emit(envelope.type, envelope)
      },
      close: () => {
        raw.client.close(1012, 'Reinício do servidor')
      },
    }
    connections.add(connection)

    raw.client.addEventListener('message', (event) => {
      if (typeof event.data === 'string' && event.data.startsWith('40')) {
        connection.userId = userIdFromConnectPacket(event.data)
      }
    })

    // Engine.IO: o servidor envia ping e o cliente responde pong; sem isso ele desconecta.
    const timer = setInterval(() => {
      raw.client.send('2')
    }, PING_INTERVAL_MS)
    raw.client.addEventListener('close', () => {
      clearInterval(timer)
      connections.delete(connection)
    })
  }),
]

/** Começa a transformar as mudanças do banco em eventos Socket.IO. */
export function startSocketServer(): () => void {
  return subscribe(onDomainEvent)
}

export function connectedClientCount(): number {
  return connections.size
}

/** Fecha todas as conexões; o cliente deve reconectar sozinho. */
export function disconnectAllClients(): void {
  for (const connection of [...connections]) connection.close()
}

/** Reenvia o último evento com o mesmo `event_id`, para exercitar a deduplicação. */
export function replayLastEvent(): boolean {
  if (!lastEnvelope) return false
  deliver(lastEnvelope)
  return true
}

/** Envia um `nft.updated` com versão antiga e valores falsos, que o cliente deve ignorar. */
export function sendStaleNftEvent(nftId: string): boolean {
  const current = nftEnvelope(nftId)
  if (!current) return false

  deliver({
    ...current,
    version: Math.max(0, current.version - 1),
    data: { price_eth: '999', available_quantity: 0, status: 'sold_out', editions: [] },
  })
  return true
}
