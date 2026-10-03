import { http, HttpResponse } from 'msw'

import { quoteRequestSchema, type QuoteDto } from '@/features/cart/schemas/cart.schemas'
import { addEth, mulEthByInt, percentOfEth, subEth, sumEth } from '@/shared/lib/money'

import { apiPath } from '../lib/apiPath'
import {
  cartItemsOf,
  findNft,
  isResponse,
  NETWORK_FEES,
  resolveCartOwner,
  toCartItemDto,
} from '../lib/cart'
import { errorResponse, readJson, validationErrorResponse } from '../lib/errors'
import { getScenario } from '../scenarios/current'

const QUOTE_TTL_MS = 5 * 60_000

interface Coupon {
  label: string
  basisPoints: number
}

/** Cupons conhecidos. `EXPIRADO` e `INVALIDO` existem para exercitar os erros do formulário. */
const COUPONS: Record<string, Coupon> = {
  LANCAMENTO10: { label: 'Desconto do lançamento', basisPoints: 1000 },
}
const EXPIRED_COUPONS = new Set(['EXPIRADO'])

const couponError = (code: 'coupon_invalid' | 'coupon_expired') =>
  errorResponse(
    422,
    code,
    code === 'coupon_expired' ? 'Este cupom expirou.' : 'Este cupom não é válido.',
    {
      coupon_code: [code === 'coupon_expired' ? 'Este cupom expirou.' : 'Este cupom não é válido.'],
    },
  )

export const quoteHandlers = [
  http.post(apiPath('/quotes'), async ({ request }) => {
    const owner = resolveCartOwner(request)
    if (isResponse(owner)) return owner.response

    const parsed = quoteRequestSchema.safeParse((await readJson(request)) ?? {})
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const network = parsed.data.network ?? 'ethereum'
    const code = parsed.data.coupon_code?.toUpperCase()

    let coupon: Coupon | undefined
    if (code) {
      if (getScenario().coupon.forceInvalid) return couponError('coupon_invalid')
      if (EXPIRED_COUPONS.has(code)) return couponError('coupon_expired')
      coupon = COUPONS[code]
      if (!coupon) return couponError('coupon_invalid')
    }

    const records = owner ? cartItemsOf(owner.key) : []
    const lines = records.flatMap((record) => {
      const nft = findNft(record.nftId)
      const dto = toCartItemDto(record)
      return nft && dto ? [{ record, nft, dto }] : []
    })

    // Linhas esgotadas continuam na lista de problemas, mas não entram nos valores.
    const payable = lines.filter(
      ({ dto }) => !dto.issues.some((issue) => issue.code === 'sold_out'),
    )
    const items = payable.map(({ record, nft }) => ({
      nft_id: nft.id,
      edition_id: record.editionId,
      quantity: record.quantity,
      unit_price_eth: nft.priceEth,
      line_total_eth: mulEthByInt(nft.priceEth, record.quantity),
      nft_version: nft.version,
    }))

    const subtotal = sumEth(items.map((item) => item.line_total_eth))
    const discount = coupon ? percentOfEth(subtotal, coupon.basisPoints) : '0'
    const fee = items.length > 0 ? NETWORK_FEES[network] : '0'

    const body: QuoteDto = {
      id: `qte_${crypto.randomUUID()}`,
      items,
      subtotal_eth: subtotal,
      discount_eth: discount,
      network_fee_eth: fee,
      total_eth: addEth(subEth(subtotal, discount), fee),
      coupon:
        coupon && code ? { code, label: coupon.label, percent: coupon.basisPoints / 100 } : null,
      network,
      issues: lines.flatMap(({ nft, dto }) =>
        dto.issues.map((issue) => ({ nft_id: nft.id, code: issue.code })),
      ),
      expires_at: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    }

    return HttpResponse.json(body)
  }),
]
