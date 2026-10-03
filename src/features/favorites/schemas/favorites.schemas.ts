import { z } from 'zod'

export const favoritesResponseSchema = z.object({ nft_ids: z.array(z.string()) })
