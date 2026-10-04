import { z } from 'zod'

import { emailSchema, passwordSchema, usernameSchema } from '@/features/auth/schemas/auth.schemas'
import { ensLabelSchema } from '@/features/wallets/schemas/wallet.schemas'

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'O nome de exibição deve ter ao menos 2 caracteres.')
  .max(40, 'O nome de exibição deve ter no máximo 40 caracteres.')

const optionalNicknameSchema = z
  .string()
  .trim()
  .max(24, 'O apelido deve ter no máximo 24 caracteres.')
  .transform((value) => (value === '' ? null : value))

export const updateProfileRequestSchema = z.object({
  display_name: displayNameSchema,
  username: usernameSchema,
  email: emailSchema,
  ens_name: ensLabelSchema.nullable(),
  wallet_nickname: optionalNicknameSchema.nullable(),
})

export const profileDtoSchema = z.object({
  display_name: z.string(),
  username: z.string(),
  email: z.string(),
  ens_name: z.string().nullable(),
  wallet_nickname: z.string().nullable(),
  avatar_url: z.string().nullable(),
})

export const changePasswordRequestSchema = z.object({
  current_password: z.string().min(1, 'Informe a senha atual.'),
  new_password: passwordSchema,
})

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>
export type ProfileDto = z.infer<typeof profileDtoSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
