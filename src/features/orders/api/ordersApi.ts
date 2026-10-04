import { z } from 'zod'

import { quoteDtoSchema } from '@/features/cart/schemas/cart.schemas'
import { mapQuote } from '@/features/cart/mappers/mapCart'
import type { Quote } from '@/features/cart/types/cart'
import { http } from '@/infrastructure/http/axios'
import { isApiError } from '@/infrastructure/http/errors'

import { mapOrder } from '../mappers/mapOrder'
import {
  orderDtoSchema,
  ordersResponseSchema,
  type CreateOrderRequest,
} from '../schemas/order.schemas'
import type { Order } from '../types/order'

export const orderKeys = {
  all: ['orders'] as const,
  detail: (orderId: string) => [...orderKeys.all, 'detail', orderId] as const,
  pending: () => [...orderKeys.all, 'pending'] as const,
}

export async function fetchOrder(orderId: string, signal: AbortSignal): Promise<Order> {
  const { data } = await http.get<unknown>(`/orders/${encodeURIComponent(orderId)}`, { signal })
  return mapOrder(orderDtoSchema.parse(data))
}

export async function fetchOrders(
  signal: AbortSignal,
  status?: 'pending' | 'confirmed' | 'rejected',
): Promise<Order[]> {
  const { data } = await http.get<unknown>('/orders', {
    signal,
    ...(status ? { params: { status } } : {}),
  })
  return ordersResponseSchema.parse(data).items.map(mapOrder)
}

export const fetchPendingOrders = (signal: AbortSignal) => fetchOrders(signal, 'pending')

/** Cria o pedido com a chave de idempotência: reenviar a mesma chave nunca cria outro pedido. */
export async function createOrder(body: CreateOrderRequest, idempotencyKey: string) {
  const { data } = await http.post<unknown>('/orders', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return mapOrder(orderDtoSchema.parse(data))
}

const staleDetailsSchema = z.object({ quote: quoteDtoSchema })

/** Cotação atualizada que o servidor devolve junto de `quote_stale`, quando for o caso. */
export function staleQuoteOf(error: unknown): Quote | null {
  if (!isApiError(error) || error.code !== 'quote_stale') return null
  const parsed = staleDetailsSchema.safeParse(error.details)
  return parsed.success ? mapQuote(parsed.data.quote) : null
}
