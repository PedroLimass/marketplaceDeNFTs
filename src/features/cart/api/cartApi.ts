import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'
import { http } from '@/infrastructure/http/axios'

import { mapAdjustments, mapCartItem, mapQuote } from '../mappers/mapCart'
import {
  cartMergeResponseSchema,
  cartResponseSchema,
  quoteDtoSchema,
  type AddCartItemRequest,
  type UpdateCartItemRequest,
} from '../schemas/cart.schemas'
import type { CartItem, CartMergeAdjustment, Quote } from '../types/cart'

const parseCart = (data: unknown): CartItem[] =>
  cartResponseSchema.parse(data).items.map(mapCartItem)

export async function fetchCart(signal: AbortSignal): Promise<CartItem[]> {
  const { data } = await http.get<unknown>('/cart', { signal })
  return parseCart(data)
}

export interface AddToCartInput {
  nftId: string
  editionId: string
  quantity: number
}

export async function addCartItem(input: AddToCartInput): Promise<CartItem[]> {
  const body: AddCartItemRequest = {
    nft_id: input.nftId,
    edition_id: input.editionId,
    quantity: input.quantity,
  }
  const { data } = await http.post<unknown>('/cart/items', body)
  return parseCart(data)
}

export async function updateCartItem(
  itemId: string,
  changes: { quantity?: number; acceptPrice?: true },
): Promise<CartItem[]> {
  const body: UpdateCartItemRequest = {
    ...(changes.quantity === undefined ? {} : { quantity: changes.quantity }),
    ...(changes.acceptPrice ? { accept_price: true } : {}),
  }
  const { data } = await http.patch<unknown>(`/cart/items/${encodeURIComponent(itemId)}`, body)
  return parseCart(data)
}

export async function removeCartItem(itemId: string): Promise<void> {
  await http.delete(`/cart/items/${encodeURIComponent(itemId)}`)
}

export async function mergeGuestCart(): Promise<{
  items: CartItem[]
  adjusted: CartMergeAdjustment[]
}> {
  const { data } = await http.post<unknown>('/cart/merge')
  const parsed = cartMergeResponseSchema.parse(data)
  return { items: parsed.items.map(mapCartItem), adjusted: mapAdjustments(parsed.adjusted) }
}

export async function createQuote(
  input: { couponCode: string | undefined; network: NetworkId },
  signal: AbortSignal,
): Promise<Quote> {
  const { data } = await http.post<unknown>(
    '/quotes',
    {
      ...(input.couponCode ? { coupon_code: input.couponCode } : {}),
      network: input.network,
    },
    { signal },
  )
  return mapQuote(quoteDtoSchema.parse(data))
}
