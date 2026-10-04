import type { QuoteDto } from '@/features/cart/schemas/cart.schemas'
import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'
import { addEth, mulEthByInt, percentOfEth, subEth, sumEth } from '@/shared/lib/money'

import { mutateDb } from '../db/mockDb'
import { getScenario } from '../scenarios/current'
import { cartItemsOf, findNft, NETWORK_FEES, toCartItemDto } from './cart'
import { errorResponse } from './errors'

export const QUOTE_TTL_MS = 5 * 60_000
const MAX_STORED_QUOTES = 30

interface Coupon {
  label: string
  basisPoints: number
}

const COUPONS: Record<string, Coupon> = {
  LANCAMENTO10: { label: 'Desconto do lançamento', basisPoints: 1000 },
}
const EXPIRED_COUPONS = new Set(['EXPIRADO'])

const couponError = (code: 'coupon_invalid' | 'coupon_expired') => {
  const message = code === 'coupon_expired' ? 'Este cupom expirou.' : 'Este cupom não é válido.'
  return errorResponse(422, code, message, { coupon_code: [message] })
}

interface BuildQuoteInput {
  ownerKey: string | null
  couponCode: string | undefined
  network: NetworkId
}

export function buildQuote({
  ownerKey,
  couponCode,
  network,
}: BuildQuoteInput): { dto: QuoteDto; couponCode: string | null } | { response: Response } {
  const code = couponCode?.toUpperCase()

  let coupon: Coupon | undefined
  if (code) {
    if (getScenario().coupon.forceInvalid) return { response: couponError('coupon_invalid') }
    if (EXPIRED_COUPONS.has(code)) return { response: couponError('coupon_expired') }
    coupon = COUPONS[code]
    if (!coupon) return { response: couponError('coupon_invalid') }
  }

  const records = ownerKey ? cartItemsOf(ownerKey) : []
  const lines = records.flatMap((record) => {
    const nft = findNft(record.nftId)
    const dto = toCartItemDto(record)
    return nft && dto ? [{ record, nft, dto }] : []
  })

  const payable = lines.filter(({ dto }) => !dto.issues.some((issue) => issue.code === 'sold_out'))
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

  const dto: QuoteDto = {
    id: `qte_${crypto.randomUUID()}`,
    items,
    subtotal_eth: subtotal,
    discount_eth: discount,
    network_fee_eth: fee,
    total_eth: addEth(subEth(subtotal, discount), fee),
    coupon:
      coupon && code ? { code, label: coupon.label, percent: coupon.basisPoints / 100 } : null,
    network,
    issues: lines.flatMap(({ nft, dto: line }) =>
      line.issues.map((issue) => ({ nft_id: nft.id, code: issue.code })),
    ),
    expires_at: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
  }

  return { dto, couponCode: code ?? null }
}

export function storeQuote(ownerKey: string, dto: QuoteDto, couponCode: string | null): void {
  mutateDb((db) => {
    db.quotes[dto.id] = { ownerKey, couponCode, createdAt: Date.now(), dto }

    const ids = Object.keys(db.quotes).sort(
      (a, b) => (db.quotes[a]?.createdAt ?? 0) - (db.quotes[b]?.createdAt ?? 0),
    )
    for (const id of ids.slice(0, Math.max(0, ids.length - MAX_STORED_QUOTES))) {
      Reflect.deleteProperty(db.quotes, id)
    }
  })
}
