import { beforeEach, describe, expect, it } from 'vitest'

import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'

import { publish } from './bus'
import {
  connectedClientCount,
  disconnectAllClients,
  replayLastEvent,
  sendStaleNftEvent,
  startSocketServer,
} from './socketServer'

beforeEach(async () => {
  await initMockDb()
  await resetMockDb()
})

describe('socketServer', () => {
  it('começa sem clientes e ignora replay sem evento anterior', () => {
    expect(connectedClientCount()).toBe(0)
    expect(replayLastEvent()).toBe(false)
    expect(sendStaleNftEvent('nao-existe')).toBe(false)
    disconnectAllClients()
  })

  it('transforma mudanças do banco em envelope e permite reenviar o último', () => {
    const stop = startSocketServer()

    publish({ kind: 'nft', nftId: 'nao-existe' })
    publish({ kind: 'nft', nftId: 'emerald-ape-042' })
    expect(replayLastEvent()).toBe(true)
    expect(sendStaleNftEvent('emerald-ape-042')).toBe(true)

    publish({ kind: 'order', orderId: 'ord_nao', userId: 'usr_1' })
    stop()
  })
})
