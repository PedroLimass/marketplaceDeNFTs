import { describe, expect, it, vi } from 'vitest'

import { createRealtimeClient } from './realtimeClient'

type Listener = (...args: unknown[]) => void

function fakeSocketFactory() {
  const listeners = new Map<string, Listener>()
  let any: ((type: string, payload: unknown) => void) | undefined
  const sockets: { auth: unknown; disconnect: ReturnType<typeof vi.fn> }[] = []

  const createSocket = vi.fn((_url: string, options: { auth?: unknown }) => {
    const disconnect = vi.fn()
    sockets.push({ auth: options.auth, disconnect })
    return {
      on(event: string, listener: Listener) {
        listeners.set(event, listener)
        return this
      },
      onAny(listener: (type: string, payload: unknown) => void) {
        any = listener
        return this
      },
      off: vi.fn(),
      offAny: vi.fn(),
      removeAllListeners: vi.fn(),
      disconnect,
    }
  })

  return {
    createSocket: createSocket as never,
    sockets,
    connect: () => listeners.get('connect')?.(),
    receive: (type: string, payload: unknown) => any?.(type, payload),
  }
}

const envelope = (overrides: Record<string, unknown> = {}) => ({
  event_id: 'evt_1',
  type: 'nft.updated',
  resource: { type: 'nft', id: 'emerald-ape-042' },
  version: 2,
  occurred_at: '2026-07-29T14:57:12Z',
  data: {},
  ...overrides,
})

describe('createRealtimeClient', () => {
  it('conecta só por websocket, enviando o token', () => {
    const fake = fakeSocketFactory()
    const client = createRealtimeClient({ url: '/', createSocket: fake.createSocket })

    client.connect({ token: 'tok_1', userId: 'u1' })

    expect(fake.createSocket).toHaveBeenCalledWith('/', {
      transports: ['websocket'],
      auth: { token: 'tok_1' },
    })
  })

  it('não reconecta com a mesma identidade e reconecta quando ela muda', () => {
    const fake = fakeSocketFactory()
    const client = createRealtimeClient({ url: '/', createSocket: fake.createSocket })

    client.connect({ token: 'tok_1', userId: 'u1' })
    client.connect({ token: 'tok_1', userId: 'u1' })
    expect(fake.sockets).toHaveLength(1)

    client.connect({ token: 'tok_2', userId: 'u2' })
    expect(fake.sockets).toHaveLength(2)
    expect(fake.sockets[0]?.disconnect).toHaveBeenCalled()
  })

  it('descarta eventos repetidos e envelopes inválidos', () => {
    const fake = fakeSocketFactory()
    const client = createRealtimeClient({ url: '/', createSocket: fake.createSocket })
    const handler = vi.fn()
    client.subscribe('nft.updated', handler)
    client.connect({ token: null, userId: null })

    fake.receive('nft.updated', envelope())
    fake.receive('nft.updated', envelope())
    fake.receive('nft.updated', { nada: true })
    fake.receive('nft.updated', envelope({ event_id: 'evt_2', version: 3 }))

    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('esquece ids antigos além da janela', () => {
    const fake = fakeSocketFactory()
    const client = createRealtimeClient({
      url: '/',
      createSocket: fake.createSocket,
      dedupeWindow: 2,
    })
    const handler = vi.fn()
    client.subscribe('nft.updated', handler)
    client.connect({ token: null, userId: null })

    for (const id of ['a', 'b', 'c', 'a']) fake.receive('nft.updated', envelope({ event_id: id }))

    expect(handler).toHaveBeenCalledTimes(4)
  })

  it('descarta eventos privados de outro usuário', () => {
    const fake = fakeSocketFactory()
    const client = createRealtimeClient({ url: '/', createSocket: fake.createSocket })
    const handler = vi.fn()
    client.subscribe('order.updated', handler)
    client.connect({ token: 'tok_1', userId: 'u1' })

    fake.receive('order.updated', envelope({ type: 'order.updated', event_id: 'a', user_id: 'u2' }))
    fake.receive('order.updated', envelope({ type: 'order.updated', event_id: 'b', user_id: 'u1' }))

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('avisa só a partir do segundo connect', () => {
    const fake = fakeSocketFactory()
    const client = createRealtimeClient({ url: '/', createSocket: fake.createSocket })
    const reconnected = vi.fn()
    client.onReconnect(reconnected)
    client.connect({ token: null, userId: null })

    fake.connect()
    expect(reconnected).not.toHaveBeenCalled()
    expect(client.getState()).toBe('connected')

    fake.connect()
    expect(reconnected).toHaveBeenCalledTimes(1)
  })

  it('desconectar encerra o socket e deixa de entregar eventos', () => {
    const fake = fakeSocketFactory()
    const client = createRealtimeClient({ url: '/', createSocket: fake.createSocket })
    client.connect({ token: 'tok_1', userId: 'u1' })

    client.disconnect()

    expect(fake.sockets[0]?.disconnect).toHaveBeenCalled()
    expect(client.getState()).toBe('disconnected')
  })
})
