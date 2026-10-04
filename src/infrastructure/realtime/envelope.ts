import { z } from 'zod'

export const envelopeSchema = z.object({
  event_id: z.string().min(1),
  type: z.string().min(1),
  resource: z.object({ type: z.string(), id: z.string() }),
  version: z.number().int().nonnegative(),
  occurred_at: z.iso.datetime(),
  /** Presente só em eventos privados; identifica o dono do recurso. */
  user_id: z.string().optional(),
  data: z.unknown(),
})

export type RealtimeEnvelope = z.infer<typeof envelopeSchema>
