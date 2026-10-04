import { z } from 'zod'

import { createOrderRequestSchema } from '../schemas/order.schemas'

export const CHECKOUT_ATTEMPT_KEY = 'checkout.attempt'

const attemptSchema = z.object({
  userId: z.string(),
  key: z.string().min(1),
  /** Descreve o que o usuário pediu (carrinho, carteira, dados). Mudou, é outra tentativa. */
  intent: z.string(),
  /** Corpo exatamente como foi enviado: reenvios usam o mesmo, mesmo que a cotação mude. */
  body: createOrderRequestSchema,
  orderId: z.string().optional(),
})

export type CheckoutAttempt = z.infer<typeof attemptSchema>

function storage(): Storage | undefined {
  return typeof sessionStorage === 'undefined' ? undefined : sessionStorage
}

export function readAttempt(userId: string): CheckoutAttempt | null {
  const raw = storage()?.getItem(CHECKOUT_ATTEMPT_KEY)
  if (!raw) return null

  try {
    const parsed = attemptSchema.safeParse(JSON.parse(raw))
    return parsed.success && parsed.data.userId === userId ? parsed.data : null
  } catch {
    return null
  }
}

export function saveAttempt(attempt: CheckoutAttempt): void {
  try {
    storage()?.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify(attempt))
  } catch {
    // Sem armazenamento, a tentativa vale só nesta aba: a retomada após recarregar fica de fora.
  }
}

export function clearAttempt(): void {
  storage()?.removeItem(CHECKOUT_ATTEMPT_KEY)
}

export const newIdempotencyKey = (): string => crypto.randomUUID()
