import { z } from 'zod'

import { networkIdSchema } from '@/features/catalog/schemas/catalog.schemas'

export const walletTypes = ['metamask', 'walletconnect', 'coinbase'] as const
export const walletRoles = ['primary', 'secondary'] as const

export const walletTypeSchema = z.enum(walletTypes)
export const walletRoleSchema = z.enum(walletRoles)

export const walletAddressSchema = z
  .string()
  .trim()
  .regex(
    /^0x[a-fA-F0-9]{40}$/,
    'Informe um endereço válido: 0x seguido de 40 caracteres hexadecimais.',
  )

export const walletNicknameSchema = z
  .string()
  .trim()
  .min(1, 'Informe um apelido para a carteira.')
  .max(24, 'O apelido deve ter no máximo 24 caracteres.')

/** Rótulo ENS sem o sufixo `.eth` (o sufixo é fixo na interface). Vazio vira `null`. */
export const ensLabelSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/\.eth$/, ''))
  .pipe(
    z
      .string()
      .max(63, 'O nome ENS deve ter no máximo 63 caracteres.')
      .regex(
        /^$|^[a-z0-9-]+(\.[a-z0-9-]+)*$/,
        'Use apenas letras minúsculas, números, hífen e ponto entre os trechos.',
      ),
  )
  .transform((value) => (value === '' ? null : value))

export const walletFieldsSchema = z.object({
  type: walletTypeSchema,
  network: networkIdSchema,
  address: walletAddressSchema,
  nickname: walletNicknameSchema,
  ens_name: ensLabelSchema.nullable().optional(),
})

/** `same_as_primary` só vale para a carteira secundária e dispensa os demais campos. */
export const sameAsPrimaryRequestSchema = z.object({ same_as_primary: z.literal(true) })

export const walletRequestSchema = z.union([sameAsPrimaryRequestSchema, walletFieldsSchema])

export const walletDtoSchema = z.object({
  id: z.string(),
  role: walletRoleSchema,
  type: walletTypeSchema,
  network: networkIdSchema,
  address: z.string(),
  nickname: z.string(),
  ens_name: z.string().nullable(),
  same_as_primary: z.boolean(),
})

export const walletsResponseSchema = z.object({ items: z.array(walletDtoSchema) })

export type WalletType = z.infer<typeof walletTypeSchema>
export type WalletRole = z.infer<typeof walletRoleSchema>
export type WalletFieldsRequest = z.infer<typeof walletFieldsSchema>
export type WalletRequest = z.infer<typeof walletRequestSchema>
export type WalletDto = z.infer<typeof walletDtoSchema>
export type WalletsResponse = z.infer<typeof walletsResponseSchema>
