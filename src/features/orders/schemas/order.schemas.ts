import { z } from 'zod'

import { ethAmountSchema, networkIdSchema } from '@/features/catalog/schemas/catalog.schemas'
import { emailSchema } from '@/features/auth/schemas/auth.schemas'
import { walletTypeSchema } from '@/features/wallets/schemas/wallet.schemas'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])

export const collectorSchema = z.object({
  display_name: z.string().trim().min(2, 'Informe o nome do colecionador.').max(40),
  email: emailSchema,
})

export const createOrderRequestSchema = z.object({
  quote_id: z.string().min(1),
  wallet_id: z.string().min(1, 'Escolha a carteira que receberá os NFTs.'),
  network: networkIdSchema,
  collector: collectorSchema,
  note: z.string().trim().max(280, 'A observação deve ter no máximo 280 caracteres.').optional(),
})

export const orderItemDtoSchema = z.object({
  nft_id: z.string(),
  name: z.string(),
  token_id: z.string(),
  image_url: z.string(),
  edition_label: z.string(),
  quantity: z.number().int().positive(),
  unit_price_eth: ethAmountSchema,
  line_total_eth: ethAmountSchema,
})

export const orderDtoSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  /** Cresce a cada mudança de estado; o cliente ignora versões menores que a que já tem. */
  version: z.number().int().positive(),
  items: z.array(orderItemDtoSchema),
  subtotal_eth: ethAmountSchema,
  discount_eth: ethAmountSchema,
  network_fee_eth: ethAmountSchema,
  total_eth: ethAmountSchema,
  network: networkIdSchema,
  wallet: z.object({
    type: walletTypeSchema,
    label: z.string(),
    address: z.string(),
  }),
  collector: collectorSchema,
  transaction: z.object({ hash: z.string(), explorer_url: z.string() }).nullable(),
  rejection: z.object({ code: z.string(), message: z.string() }).nullable(),
  created_at: z.iso.datetime(),
  resolved_at: z.iso.datetime().nullable(),
})

export const ordersResponseSchema = z.object({ items: z.array(orderDtoSchema) })

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>
export type OrderItemDto = z.infer<typeof orderItemDtoSchema>
export type OrderDto = z.infer<typeof orderDtoSchema>
