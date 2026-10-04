import { delay, http, HttpResponse } from 'msw'

import {
  createOrderRequestSchema,
  orderStatusSchema,
  type OrderDto,
} from '@/features/orders/schemas/order.schemas'
import { addEth, compareEth } from '@/shared/lib/money'

import { getDb, mutateDb } from '../db/mockDb'
import type { OrderRecord, QuoteRecord } from '../db/types'
import { apiPath } from '../lib/apiPath'
import { cartKeyOfUser, findNft } from '../lib/cart'
import { errorResponse, readJson, validationErrorResponse } from '../lib/errors'
import { updateNft } from '../lib/nftMutations'
import { findOrder, resolveDueOrders, scheduleOrderResolution } from '../lib/orders'
import { buildQuote, storeQuote } from '../lib/quotes'
import { toNftSummaryDto } from '../lib/nftDto'
import { requireUser } from '../lib/session'
import { toWalletDto, walletsOf } from '../lib/wallets'
import { getScenario } from '../scenarios/current'

export const IDEMPOTENCY_HEADER = 'Idempotency-Key'
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60_000

const walletLabels = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

function hashBody(value: unknown): string {
  const text = JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  )
  let hash = 5381
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(index)) | 0
  }
  return String(hash >>> 0)
}

function applyCheckoutScenario(quote: QuoteRecord): void {
  const effectKey = `checkout:${quote.ownerKey}`
  if (getDb().scenarioEffects[effectKey]) return
  const { checkout } = getScenario()
  const first = quote.dto.items[0]
  if (!first || (!checkout.priceChange && !checkout.soldOut)) return

  mutateDb((db) => {
    db.scenarioEffects[effectKey] = true
  })
  if (checkout.soldOut) {
    updateNft(first.nft_id, (nft) => {
      const edition = nft.editions.find((candidate) => candidate.id === first.edition_id)
      if (edition) edition.available = 0
    })
  } else {
    updateNft(first.nft_id, (nft) => {
      nft.previousPriceEth = nft.priceEth
      nft.priceEth = addEth(nft.priceEth, '0.1')
    })
  }
}

function unavailableItems(quote: QuoteRecord) {
  return quote.dto.items.flatMap((item) => {
    const nft = findNft(item.nft_id)
    const edition = nft?.editions.find((candidate) => candidate.id === item.edition_id)
    const available = edition?.available ?? 0
    return available < item.quantity ? [{ nft_id: item.nft_id, available }] : []
  })
}

function isStale(quote: QuoteRecord): boolean {
  if (new Date(quote.dto.expires_at).getTime() <= Date.now()) return true
  if (quote.dto.issues.length > 0) return true

  const current = buildQuote({
    ownerKey: quote.ownerKey,
    couponCode: quote.couponCode ?? undefined,
    network: quote.dto.network,
  })
  if ('response' in current) return true

  const sameItems =
    current.dto.items.length === quote.dto.items.length &&
    current.dto.items.every((item, index) => {
      const old = quote.dto.items[index]
      return (
        old?.nft_id === item.nft_id &&
        old.edition_id === item.edition_id &&
        old.quantity === item.quantity &&
        old.nft_version === item.nft_version &&
        compareEth(old.unit_price_eth, item.unit_price_eth) === 0
      )
    })
  return !sameItems
}

const orderResponse = (order: OrderDto, status: number) => HttpResponse.json(order, { status })

export const ordersHandlers = [
  http.post(apiPath('/orders'), async ({ request }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response
    const { user } = auth

    const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)
    if (!idempotencyKey) {
      return errorResponse(
        400,
        'idempotency_key_required',
        'Envie o cabeçalho Idempotency-Key para criar um pedido.',
      )
    }

    const parsed = createOrderRequestSchema.safeParse((await readJson(request)) ?? {})
    if (!parsed.success) return validationErrorResponse(parsed.error)
    const body = parsed.data

    const storageKey = `${user.id}:${idempotencyKey}`
    const bodyHash = hashBody(body)
    const previous = getDb().idempotency[storageKey]

    if (previous && Date.now() - previous.createdAt < IDEMPOTENCY_TTL_MS) {
      if (previous.bodyHash !== bodyHash) {
        return errorResponse(
          409,
          'idempotency_key_reused',
          'Esta chave já foi usada em um pedido diferente.',
        )
      }
      const existing = findOrder(previous.orderId)
      if (existing) {
        return orderResponse(existing.dto, 200)
      }
    }

    const quote = getDb().quotes[body.quote_id]
    if (quote?.ownerKey !== cartKeyOfUser(user.id)) {
      return errorResponse(422, 'validation_failed', 'A cotação não existe ou expirou.', {
        quote_id: ['A cotação não existe ou expirou.'],
      })
    }

    const wallet = walletsOf(user.id).find((candidate) => candidate.id === body.wallet_id)
    if (!wallet) {
      return errorResponse(422, 'validation_failed', 'Carteira não encontrada.', {
        wallet_id: ['Escolha uma das suas carteiras.'],
      })
    }
    const walletDto = toWalletDto(wallet, user.id)
    if (walletDto.network !== body.network || quote.dto.network !== body.network) {
      return errorResponse(422, 'validation_failed', 'A rede não corresponde à carteira.', {
        network: ['A rede deve ser a da carteira escolhida.'],
      })
    }
    if (quote.dto.items.length === 0) {
      return errorResponse(422, 'cart_empty', 'Seu carrinho está vazio.')
    }

    applyCheckoutScenario(quote)

    const unavailable = unavailableItems(quote)
    if (unavailable.length > 0) {
      return errorResponse(
        409,
        'insufficient_availability',
        'Alguns itens não têm mais a quantidade escolhida.',
        undefined,
        { items: unavailable },
      )
    }

    if (isStale(quote)) {
      const fresh = buildQuote({
        ownerKey: quote.ownerKey,
        couponCode: quote.couponCode ?? undefined,
        network: quote.dto.network,
      })
      const next =
        'response' in fresh
          ? buildQuote({
              ownerKey: quote.ownerKey,
              couponCode: undefined,
              network: quote.dto.network,
            })
          : fresh
      if ('response' in next) return next.response

      storeQuote(quote.ownerKey, next.dto, next.couponCode)
      return errorResponse(
        409,
        'quote_stale',
        'Os valores mudaram desde a última conferência.',
        undefined,
        { quote: next.dto },
      )
    }

    const scenario = getScenario()
    const createdAt = Date.now()
    const items = quote.dto.items.flatMap((item) => {
      const nft = findNft(item.nft_id)
      const edition = nft?.editions.find((candidate) => candidate.id === item.edition_id)
      if (!nft || !edition) return []
      return [
        {
          nft_id: nft.id,
          name: nft.name,
          token_id: nft.tokenId,
          image_url: toNftSummaryDto(nft).thumbnail_url,
          edition_label: edition.label,
          quantity: item.quantity,
          unit_price_eth: item.unit_price_eth,
          line_total_eth: item.line_total_eth,
        },
      ]
    })

    const record: OrderRecord = {
      userId: user.id,
      resolveAt: createdAt + scenario.order.resolveAfterMs,
      outcome: scenario.order.resolution,
      purchased: quote.dto.items.map((item) => ({
        nftId: item.nft_id,
        editionId: item.edition_id,
        quantity: item.quantity,
      })),
      dto: {
        id: `ord_${crypto.randomUUID().slice(0, 8)}`,
        status: 'pending',
        version: 1,
        items,
        subtotal_eth: quote.dto.subtotal_eth,
        discount_eth: quote.dto.discount_eth,
        network_fee_eth: quote.dto.network_fee_eth,
        total_eth: quote.dto.total_eth,
        network: quote.dto.network,
        wallet: {
          type: walletDto.type,
          label: walletLabels[walletDto.type],
          address: walletDto.address,
        },
        collector: body.collector,
        transaction: null,
        rejection: null,
        created_at: new Date(createdAt).toISOString(),
        resolved_at: null,
      },
    }

    mutateDb((db) => {
      db.orders.push(record)
      db.idempotency[storageKey] = { bodyHash, orderId: record.dto.id, createdAt }
      Reflect.deleteProperty(db.quotes, quote.dto.id)
    })

    for (const line of record.purchased) {
      updateNft(line.nftId, (nft) => {
        const edition = nft.editions.find((candidate) => candidate.id === line.editionId)
        if (edition) edition.available -= line.quantity
      })
    }

    scheduleOrderResolution(record)

    await delay(scenario.order.responseDelayMs)
    return orderResponse(record.dto, 202)
  }),

  http.get(apiPath('/orders'), ({ request }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    resolveDueOrders()
    const status = orderStatusSchema.safeParse(new URL(request.url).searchParams.get('status'))

    const items = getDb()
      .orders.filter((order) => order.userId === auth.user.id)
      .filter((order) => !status.success || order.dto.status === status.data)
      .map((order) => order.dto)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))

    return HttpResponse.json({ items })
  }),

  http.get(apiPath('/orders/:orderId'), ({ request, params }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    resolveDueOrders()
    const order = findOrder(String(params.orderId))
    if (order?.userId !== auth.user.id) {
      return errorResponse(404, 'order_not_found', 'Pedido não encontrado.')
    }
    return HttpResponse.json(order.dto)
  }),
]
