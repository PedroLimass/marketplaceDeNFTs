import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import { authenticate } from '../lib/session'
import { nftEnvelope, orderEnvelope, type MockEnvelope } from './envelopes'
import { subscribe, type DomainEvent } from './bus'

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

    const timer = setInterval(() => {
      raw.client.send('2')
    }, PING_INTERVAL_MS)
    raw.client.addEventListener('close', () => {
      clearInterval(timer)
      connections.delete(connection)
    })
  }),
]

export function startSocketServer(): () => void {
  return subscribe(onDomainEvent)
}

export function connectedClientCount(): number {
  return connections.size
}

export function disconnectAllClients(): void {
  for (const connection of [...connections]) connection.close()
}

export function replayLastEvent(): boolean {
  if (!lastEnvelope) return false
  deliver(lastEnvelope)
  return true
}

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
