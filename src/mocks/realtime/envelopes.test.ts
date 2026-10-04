import { beforeEach, describe, expect, it } from 'vitest'

import { initMockDb, mutateDb, resetMockDb } from '@/mocks/db/mockDb'

import { nftEnvelope, orderEnvelope } from './envelopes'

beforeEach(async () => {
  await initMockDb()
  await resetMockDb()
})

describe('nftEnvelope', () => {
  it('devolve undefined para um NFT que não existe', () => {
    expect(nftEnvelope('nao-existe')).toBeUndefined()
  })

  it('monta o evento com preço, estoque e edições atuais', () => {
    const envelope = nftEnvelope('emerald-ape-042')

    expect(envelope).toMatchObject({
      type: 'nft.updated',
      resource: { type: 'nft', id: 'emerald-ape-042' },
    })
    expect(envelope?.event_id).toMatch(/^evt_/)
    expect(envelope?.data).toEqual(
      expect.objectContaining({
        price_eth: expect.any(String),
        available_quantity: expect.any(Number),
        status: 'open',
        editions: expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })]),
      }),
    )
  })
})

describe('orderEnvelope', () => {
  it('devolve undefined para um pedido que não existe', () => {
    expect(orderEnvelope('ord_nao')).toBeUndefined()
  })

  it('inclui o usuário e o estado do pedido', () => {
    mutateDb((draft) => {
      draft.orders.push({
        userId: 'usr_nova',
        resolveAt: Date.now() + 1_000,
        outcome: 'confirmed',
        purchased: [],
        dto: {
          id: 'ord_test',
          status: 'pending',
          version: 1,
          items: [],
          subtotal_eth: '1.00',
          discount_eth: '0',
          network_fee_eth: '0.016',
          total_eth: '1.016',
          network: 'ethereum',
          wallet: { type: 'metamask', label: 'Principal', address: '0xabc' },
          collector: { display_name: 'Nova', email: 'nova@kurio.test' },
          transaction: null,
          rejection: null,
          created_at: '2026-07-29T14:00:00.000Z',
          resolved_at: null,
        },
      })
    })

    expect(orderEnvelope('ord_test')).toMatchObject({
      type: 'order.updated',
      resource: { type: 'order', id: 'ord_test' },
      user_id: 'usr_nova',
      data: { status: 'pending', transaction: null, rejection: null },
    })
  })
})
