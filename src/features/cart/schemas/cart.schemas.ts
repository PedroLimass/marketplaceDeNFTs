import { z } from 'zod'

import {
  ethAmountSchema,
  networkIdSchema,
  nftStatusSchema,
} from '@/features/catalog/schemas/catalog.schemas'

export const cartIssueDtoSchema = z.discriminatedUnion('code', [
  z.object({
    code: z.literal('price_changed'),
    previous_price_eth: ethAmountSchema,
    price_eth: ethAmountSchema,
  }),
  z.object({ code: z.literal('insufficient_availability'), available: z.number().int() }),
  z.object({ code: z.literal('sold_out') }),
])

export const cartItemDtoSchema = z.object({
  id: z.string(),
  nft: z.object({
    id: z.string(),
    name: z.string(),
    token_id: z.string(),
    thumbnail_url: z.string(),
    network: networkIdSchema,
    status: nftStatusSchema,
    version: z.number().int().nonnegative(),
  }),
  edition: z.object({
    id: z.string(),
    label: z.string(),
    available: z.number().int().nonnegative(),
  }),
  quantity: z.number().int().positive(),
  /** Maior quantidade que o usuário pode ter nesta linha (disponibilidade e limite por pedido). */
  max_quantity: z.number().int().nonnegative(),
  unit_price_eth: ethAmountSchema,
  line_total_eth: ethAmountSchema,
  issues: z.array(cartIssueDtoSchema),
})

export const cartResponseSchema = z.object({ items: z.array(cartItemDtoSchema) })

export const cartMergeResponseSchema = cartResponseSchema.extend({
  adjusted: z.array(
    z.object({
      nft_id: z.string(),
      name: z.string(),
      requested: z.number().int(),
      applied: z.number().int(),
    }),
  ),
})

export const addCartItemRequestSchema = z.object({
  nft_id: z.string().min(1),
  edition_id: z.string().min(1),
  quantity: z.number().int().min(1),
})

export const updateCartItemRequestSchema = z
  .object({
    quantity: z.number().int().min(1).optional(),
    accept_price: z.literal(true).optional(),
  })
  .refine((value) => value.quantity !== undefined || value.accept_price !== undefined, {
    message: 'Informe a quantidade ou aceite o novo preço.',
  })

export const quoteRequestSchema = z.object({
  coupon_code: z.string().trim().max(40).optional(),
  network: networkIdSchema.optional(),
})

export const quoteDtoSchema = z.object({
  id: z.string(),
  items: z.array(
    z.object({
      nft_id: z.string(),
      edition_id: z.string(),
      quantity: z.number().int().positive(),
      unit_price_eth: ethAmountSchema,
      line_total_eth: ethAmountSchema,
      nft_version: z.number().int().nonnegative(),
    }),
  ),
  subtotal_eth: ethAmountSchema,
  discount_eth: ethAmountSchema,
  network_fee_eth: ethAmountSchema,
  total_eth: ethAmountSchema,
  coupon: z.object({ code: z.string(), label: z.string(), percent: z.number() }).nullable(),
  network: networkIdSchema,
  issues: z.array(
    z.object({
      nft_id: z.string(),
      code: z.enum(['price_changed', 'sold_out', 'insufficient_availability']),
    }),
  ),
  expires_at: z.string(),
})

export type CartIssueDto = z.infer<typeof cartIssueDtoSchema>
export type CartItemDto = z.infer<typeof cartItemDtoSchema>
export type CartResponse = z.infer<typeof cartResponseSchema>
export type CartMergeResponse = z.infer<typeof cartMergeResponseSchema>
export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>
export type QuoteRequest = z.infer<typeof quoteRequestSchema>
export type QuoteDto = z.infer<typeof quoteDtoSchema>
