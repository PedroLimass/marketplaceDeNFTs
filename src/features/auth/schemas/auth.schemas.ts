import { z } from 'zod'

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'O nome de usuário deve ter ao menos 3 caracteres.')
  .max(24, 'O nome de usuário deve ter no máximo 24 caracteres.')
  .regex(/^[a-zA-Z0-9._]+$/, 'Use apenas letras, números, ponto e sublinhado.')

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Informe um e-mail válido.'))

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres.')
  .regex(/[A-Za-z]/, 'A senha deve conter ao menos uma letra.')
  .regex(/\d/, 'A senha deve conter ao menos um número.')

export const registerRequestSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const registerFormSchema = registerRequestSchema
  .extend({ confirmPassword: z.string().min(1, 'Confirme a senha.') })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  })

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha.'),
})

export const userDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string(),
  email: z.string(),
  ens_name: z.string().nullable(),
  wallet_nickname: z.string().nullable(),
  avatar_url: z.string().nullable(),
})

export const authResponseSchema = z.object({
  user: userDtoSchema,
  access_token: z.string(),
  expires_at: z.iso.datetime(),
})

export const sessionResponseSchema = z.object({
  user: userDtoSchema.nullable(),
  expires_at: z.iso.datetime().nullable(),
})

export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type RegisterFormValues = z.infer<typeof registerFormSchema>
export type LoginRequest = z.infer<typeof loginRequestSchema>
export type UserDto = z.infer<typeof userDtoSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type SessionResponse = z.infer<typeof sessionResponseSchema>
