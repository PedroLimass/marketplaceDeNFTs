import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { RealtimeClient } from '@/infrastructure/realtime/realtimeClient'
import type { RealtimeEnvelope } from '@/infrastructure/realtime/envelope'

import { orderKeys } from '../api/ordersApi'
import type { Order } from '../types/order'
import { applyOrderUpdate, registerOrderRealtime } from './orderRealtime'

const pending = {
  id: 'ord_1',
  status: 'pending',
  version: 1,
  transaction: null,
} as unknown as Order

const event = (data: unknown, version: number, id = 'evt_1'): RealtimeEnvelope => ({
  event_id: id,
  type: 'order.updated',
  resource: { type: 'order', id: 'ord_1' },
  version,
  occurred_at: '2026-07-29T14:57:12.000Z',
  user_id: 'u1',
  data,
})

const confirmed = {
  status: 'confirmed',
  transaction: { hash: '0xabc', explorer_url: 'https://etherscan.io/tx/0xabc' },
  rejection: null,
}

describe('applyOrderUpdate', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.setQueryData(orderKeys.detail('ord_1'), pending)
  })

  it('aplica a confirmação com transação e data de resolução', () => {
    applyOrderUpdate(queryClient, event(confirmed, 2))

    expect(queryClient.getQueryData<Order>(orderKeys.detail('ord_1'))).toMatchObject({
      status: 'confirmed',
      version: 2,
      transaction: { hash: '0xabc', explorerUrl: 'https://etherscan.io/tx/0xabc' },
      resolvedAt: '2026-07-29T14:57:12.000Z',
    })
  })

  it('não regride: versão antiga e pedido terminal não mudam', () => {
    applyOrderUpdate(queryClient, event(confirmed, 2))
    applyOrderUpdate(queryClient, event({ status: 'pending' }, 1, 'evt_2'))
    applyOrderUpdate(queryClient, event({ status: 'rejected' }, 5, 'evt_3'))

    expect(queryClient.getQueryData<Order>(orderKeys.detail('ord_1'))?.status).toBe('confirmed')
  })

  it('pedido que a aba não conhece é buscado no REST', () => {
    const other = new QueryClient()

    applyOrderUpdate(other, event(confirmed, 2))

    expect(other.getQueryData(orderKeys.detail('ord_1'))).toBeUndefined()
  })

  it('registra o handler no cliente de tempo real', () => {
    const subscribe = vi.fn((_type: string, _handler: (event: RealtimeEnvelope) => void) => vi.fn())
    const stop = registerOrderRealtime({ subscribe } as unknown as RealtimeClient, queryClient)

    expect(subscribe).toHaveBeenCalledWith('order.updated', expect.any(Function))
    const handler = subscribe.mock.calls[0]?.[1]
    handler?.(event(confirmed, 2))
    expect(queryClient.getQueryData<Order>(orderKeys.detail('ord_1'))?.status).toBe('confirmed')
    stop()
  })
})
