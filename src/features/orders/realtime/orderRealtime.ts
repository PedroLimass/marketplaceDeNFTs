import type { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { cartKeys } from '@/features/cart/api/cartKeys'
import type { RealtimeEnvelope } from '@/infrastructure/realtime/envelope'
import type { RealtimeClient } from '@/infrastructure/realtime/realtimeClient'

import { orderKeys } from '../api/ordersApi'
import { orderStatusSchema } from '../schemas/order.schemas'
import { isTerminal, type Order } from '../types/order'

const orderUpdateSchema = z.object({
  status: orderStatusSchema,
  transaction: z.object({ hash: z.string(), explorer_url: z.string() }).nullish(),
  rejection: z.object({ code: z.string(), message: z.string() }).nullish(),
})

export function applyOrderUpdate(queryClient: QueryClient, event: RealtimeEnvelope): void {
  const parsed = orderUpdateSchema.safeParse(event.data)
  if (!parsed.success) return

  const key = orderKeys.detail(event.resource.id)
  const cached = queryClient.getQueryData<Order>(key)

  if (!cached) {
    // Pedido que esta aba ainda não conhece: busca o retrato completo no REST.
    void queryClient.invalidateQueries({ queryKey: orderKeys.all })
    return
  }
  // Estado final não muda mais, e versão antiga nunca sobrescreve a mais nova.
  if (isTerminal(cached) || event.version <= cached.version) return

  const { data } = parsed
  queryClient.setQueryData<Order>(key, {
    ...cached,
    status: data.status,
    version: event.version,
    transaction: data.transaction
      ? { hash: data.transaction.hash, explorerUrl: data.transaction.explorer_url }
      : null,
    rejection: data.rejection ?? null,
    resolvedAt: data.status === 'pending' ? null : event.occurred_at,
  })

  void queryClient.invalidateQueries({ queryKey: orderKeys.pending() })
  // A compra confirmada tira itens do carrinho, e a recusada devolve o estoque.
  void queryClient.invalidateQueries({ queryKey: cartKeys.all })
}

export function registerOrderRealtime(
  client: RealtimeClient,
  queryClient: QueryClient,
): () => void {
  return client.subscribe('order.updated', (event) => {
    applyOrderUpdate(queryClient, event)
  })
}
