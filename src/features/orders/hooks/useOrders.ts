import { queryOptions, useQuery } from '@tanstack/react-query'

import { fetchOrder, orderKeys } from '../api/ordersApi'
import { isTerminal } from '../types/order'

const POLL_INTERVAL_MS = 3_000

export const orderQueryOptions = (orderId: string) =>
  queryOptions({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    // Rede de segurança: o tempo real entrega a mudança na hora, e a consulta periódica
    // cobre o caso de o socket estar fora do ar. Para sozinha no estado final.
    refetchInterval: (query) => {
      const order = query.state.data
      return order && isTerminal(order) ? false : POLL_INTERVAL_MS
    },
  })

export function useOrder(orderId: string) {
  return useQuery(orderQueryOptions(orderId))
}
