import { http, HttpResponse } from 'msw'

import { quoteRequestSchema } from '@/features/cart/schemas/cart.schemas'

import { apiPath } from '../lib/apiPath'
import { isResponse, resolveCartOwner } from '../lib/cart'
import { readJson, validationErrorResponse } from '../lib/errors'
import { buildQuote, storeQuote } from '../lib/quotes'

export const quoteHandlers = [
  http.post(apiPath('/quotes'), async ({ request }) => {
    const owner = resolveCartOwner(request)
    if (isResponse(owner)) return owner.response

    const parsed = quoteRequestSchema.safeParse((await readJson(request)) ?? {})
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const quote = buildQuote({
      ownerKey: owner?.key ?? null,
      couponCode: parsed.data.coupon_code,
      network: parsed.data.network ?? 'ethereum',
    })
    if ('response' in quote) return quote.response

    if (owner) storeQuote(owner.key, quote.dto, quote.couponCode)
    return HttpResponse.json(quote.dto)
  }),
]
