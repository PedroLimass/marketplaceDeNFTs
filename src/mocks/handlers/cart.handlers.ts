import { http, HttpResponse } from 'msw'

import {
  addCartItemRequestSchema,
  updateCartItemRequestSchema,
  type CartMergeResponse,
} from '@/features/cart/schemas/cart.schemas'

import { mutateDb } from '../db/mockDb'
import type { CartItemRecord } from '../db/types'
import { apiPath } from '../lib/apiPath'
import {
  cartItemsOf,
  findNft,
  GUEST_HEADER,
  isResponse,
  itemLimit,
  missingOwnerResponse,
  resolveCartOwner,
  toCartResponse,
} from '../lib/cart'
import { errorResponse, readJson, validationErrorResponse } from '../lib/errors'
import { requireUser } from '../lib/session'

const itemNotFound = () =>
  errorResponse(404, 'cart_item_not_found', 'Este item não está no carrinho.')

function conflict(limit: number, available: number) {
  return errorResponse(
    409,
    'insufficient_availability',
    available === 0
      ? 'Esta edição está esgotada.'
      : `Só é possível comprar até ${String(limit)} unidade(s) desta edição.`,
    undefined,
    { available, limit },
  )
}

export const cartHandlers = [
  http.get(apiPath('/cart'), ({ request }) => {
    const owner = resolveCartOwner(request)
    if (isResponse(owner)) return owner.response

    return HttpResponse.json(owner ? toCartResponse(owner.key) : { items: [] })
  }),

  http.post(apiPath('/cart/items'), async ({ request }) => {
    const owner = resolveCartOwner(request)
    if (isResponse(owner)) return owner.response
    if (!owner) return missingOwnerResponse()

    const parsed = addCartItemRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const { nft_id: nftId, edition_id: editionId, quantity } = parsed.data
    const nft = findNft(nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === editionId)
    if (!nft || !edition) {
      return errorResponse(404, 'nft_not_found', 'Este NFT ou edição não foi encontrado.')
    }

    const limit = itemLimit(nft, editionId)
    const existing = cartItemsOf(owner.key).find(
      (item) => item.nftId === nftId && item.editionId === editionId,
    )
    const total = (existing?.quantity ?? 0) + quantity
    if (total > limit) return conflict(limit, edition.available)

    mutateDb((db) => {
      const items = db.carts[owner.key] ?? []
      const line = items.find((item) => item.id === existing?.id)

      if (line) {
        line.quantity = total
        line.priceSeenEth = nft.priceEth
      } else {
        items.push({
          id: `ci_${crypto.randomUUID()}`,
          nftId,
          editionId,
          quantity,
          priceSeenEth: nft.priceEth,
        })
      }
      db.carts[owner.key] = items
    })

    return HttpResponse.json(toCartResponse(owner.key), { status: 201 })
  }),

  http.patch(apiPath('/cart/items/:itemId'), async ({ request, params }) => {
    const owner = resolveCartOwner(request)
    if (isResponse(owner)) return owner.response
    if (!owner) return missingOwnerResponse()

    const parsed = updateCartItemRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const item = cartItemsOf(owner.key).find((candidate) => candidate.id === params.itemId)
    const nft = item && findNft(item.nftId)
    if (!item || !nft) return itemNotFound()

    const { quantity, accept_price: acceptPrice } = parsed.data
    if (quantity !== undefined) {
      const limit = itemLimit(nft, item.editionId)
      const edition = nft.editions.find((candidate) => candidate.id === item.editionId)
      if (quantity > limit) return conflict(limit, edition?.available ?? 0)
    }

    mutateDb(() => {
      if (quantity !== undefined) item.quantity = quantity
      if (acceptPrice) item.priceSeenEth = nft.priceEth
    })

    return HttpResponse.json(toCartResponse(owner.key))
  }),

  http.delete(apiPath('/cart/items/:itemId'), ({ request, params }) => {
    const owner = resolveCartOwner(request)
    if (isResponse(owner)) return owner.response
    if (!owner) return new HttpResponse(null, { status: 204 })

    mutateDb((db) => {
      db.carts[owner.key] = cartItemsOf(owner.key).filter((item) => item.id !== params.itemId)
    })

    return new HttpResponse(null, { status: 204 })
  }),

  // Une o carrinho do visitante ao do usuário logo após o login. É idempotente: o carrinho
  // do visitante é esvaziado, então repetir a chamada não soma duas vezes.
  http.post(apiPath('/cart/merge'), ({ request }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    const guestId = request.headers.get(GUEST_HEADER)
    const userKey = `user:${auth.user.id}`
    const guestKey = guestId ? `guest:${guestId}` : null
    const adjusted: CartMergeResponse['adjusted'] = []

    if (guestKey) {
      mutateDb((db) => {
        const target: CartItemRecord[] = db.carts[userKey] ?? []

        for (const incoming of db.carts[guestKey] ?? []) {
          const nft = db.nfts.find((candidate) => candidate.id === incoming.nftId)
          if (!nft) continue

          const limit = itemLimit(nft, incoming.editionId)
          const line = target.find(
            (item) => item.nftId === incoming.nftId && item.editionId === incoming.editionId,
          )
          const requested = (line?.quantity ?? 0) + incoming.quantity
          const applied = Math.min(requested, limit)

          if (applied < requested) {
            adjusted.push({ nft_id: nft.id, name: nft.name, requested, applied })
          }
          if (applied === 0) continue

          if (line) line.quantity = applied
          else target.push({ ...incoming, id: `ci_${crypto.randomUUID()}`, quantity: applied })
        }

        db.carts[userKey] = target
        db.carts[guestKey] = []
      })
    }

    const body: CartMergeResponse = { ...toCartResponse(userKey), adjusted }
    return HttpResponse.json(body)
  }),
]
