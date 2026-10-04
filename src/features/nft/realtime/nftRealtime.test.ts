import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { cartKeys } from '@/features/cart/api/cartKeys'
import type { CartItem } from '@/features/cart/types/cart'
import { catalogKeys } from '@/features/catalog/api/catalogKeys'
import type { NftDetail } from '@/features/catalog/types/catalog'
import type { RealtimeClient } from '@/infrastructure/realtime/realtimeClient'
import type { RealtimeEnvelope } from '@/infrastructure/realtime/envelope'
import { toast } from '@/shared/lib/toast'

import { applyNftUpdate, registerNftRealtime } from './nftRealtime'

const detail = {
  id: 'emerald-ape-042',
  name: 'Emerald Ape #042',
  priceEth: '1.19',
  availableQuantity: 59,
  status: 'open',
  version: 3,
  editions: [
    { id: '1/50', available: 50 },
    { id: '1/10', available: 8 },
  ],
} as unknown as NftDetail

const event = (overrides: Partial<RealtimeEnvelope> = {}): RealtimeEnvelope => ({
  event_id: 'evt_1',
  type: 'nft.updated',
  resource: { type: 'nft', id: 'emerald-ape-042' },
  version: 4,
  occurred_at: '2026-07-29T14:57:12.000Z',
  data: {
    price_eth: '1.29',
    available_quantity: 40,
    status: 'open',
    editions: [{ id: '1/50', available: 31 }],
  },
  ...overrides,
})

describe('applyNftUpdate', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.setQueryData(catalogKeys.detail('emerald-ape-042'), detail)
    queryClient.setQueryData(catalogKeys.featured(), { featured: detail, trending: [detail] })
    toast.clear()
  })

  it('atualiza preço, estoque e versão do NFT em todas as consultas do catálogo', () => {
    applyNftUpdate(queryClient, event())

    const updated = queryClient.getQueryData<NftDetail>(catalogKeys.detail('emerald-ape-042'))
    expect(updated).toMatchObject({ priceEth: '1.29', availableQuantity: 40, version: 4 })
    expect(updated?.editions.map((edition) => edition.available)).toEqual([31, 8])
    const featured = queryClient.getQueryData<{ trending: NftDetail[] }>(catalogKeys.featured())
    expect(featured?.trending[0]?.priceEth).toBe('1.29')
  })

  it('ignora evento com versão igual ou menor que a do cache', () => {
    applyNftUpdate(queryClient, event({ version: 3 }))
    applyNftUpdate(queryClient, event({ version: 1, event_id: 'evt_2' }))

    expect(
      queryClient.getQueryData<NftDetail>(catalogKeys.detail('emerald-ape-042'))?.priceEth,
    ).toBe('1.19')
  })

  it('ignora dados que não seguem o contrato', () => {
    applyNftUpdate(queryClient, event({ data: { price_eth: 'abc' } }))

    expect(
      queryClient.getQueryData<NftDetail>(catalogKeys.detail('emerald-ape-042'))?.version,
    ).toBe(3)
  })

  it('invalida o carrinho e avisa quando o NFT está nele', () => {
    const item = {
      id: 'ci_1',
      nft: { id: 'emerald-ape-042', name: 'Emerald Ape #042', version: 3 },
    }
    queryClient.setQueryData(cartKeys.items(), [item] as unknown)

    applyNftUpdate(queryClient, event())

    expect(queryClient.getQueryState(cartKeys.items())?.isInvalidated).toBe(true)
  })

  it('não mexe no carrinho quando o NFT não está nele', () => {
    queryClient.setQueryData(cartKeys.items(), [] as CartItem[])

    applyNftUpdate(queryClient, event())

    expect(queryClient.getQueryState(cartKeys.items())?.isInvalidated).toBe(false)
  })

  it('registra o handler no cliente de tempo real', () => {
    const subscribe = vi.fn(() => vi.fn())
    const stop = registerNftRealtime({ subscribe } as unknown as RealtimeClient, queryClient)

    expect(subscribe).toHaveBeenCalledWith('nft.updated', expect.any(Function))
    stop()
  })
})
