import type { CartIssueDto, CartItemDto } from '@/features/cart/schemas/cart.schemas'
import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'

import { getDb } from '../db/mockDb'
import type { CartItemRecord, NftRecord } from '../db/types'
import { authenticate, sessionExpiredResponse } from './session'
import { errorResponse } from './errors'
import { MAX_PER_ORDER, toNftSummaryDto } from './nftDto'
import { mulEthByInt } from '@/shared/lib/money'

export const GUEST_HEADER = 'X-Guest-Id'

/** Taxas de rede por blockchain; a do Ethereum é o valor do design. */
export const NETWORK_FEES: Record<NetworkId, string> = {
  ethereum: '0.016',
  polygon: '0.001',
  solana: '0.0005',
}

export const cartKeyOfUser = (userId: string) => `user:${userId}`

export interface CartOwner {
  key: string
  userId: string | null
}

/**
 * Dono do carrinho: o usuário autenticado ou, sem sessão, o visitante identificado por
 * `X-Guest-Id`. Token vencido é erro (não vira visitante em silêncio), para o cliente
 * encerrar a sessão em vez de mostrar um carrinho diferente do esperado.
 */
export function resolveCartOwner(request: Request): CartOwner | { response: Response } | null {
  const auth = authenticate(request)

  if (auth.authenticated) return { key: cartKeyOfUser(auth.user.id), userId: auth.user.id }
  if (auth.reason === 'expired') return { response: sessionExpiredResponse() }

  const guestId = request.headers.get(GUEST_HEADER)
  return guestId ? { key: `guest:${guestId}`, userId: null } : null
}

export function isResponse(value: unknown): value is { response: Response } {
  return typeof value === 'object' && value !== null && 'response' in value
}

export const missingOwnerResponse = () =>
  errorResponse(400, 'validation_failed', 'Identifique o visitante com o cabeçalho X-Guest-Id.')

export function findNft(nftId: string): NftRecord | undefined {
  return getDb().nfts.find((candidate) => candidate.id === nftId)
}

export function itemLimit(nft: NftRecord, editionId: string): number {
  const edition = nft.editions.find((candidate) => candidate.id === editionId)
  return edition ? Math.min(edition.available, MAX_PER_ORDER) : 0
}

function issuesOf(item: CartItemRecord, nft: NftRecord): CartIssueDto[] {
  const edition = nft.editions.find((candidate) => candidate.id === item.editionId)
  const available = edition?.available ?? 0
  const issues: CartIssueDto[] = []

  if (available === 0) issues.push({ code: 'sold_out' })
  else if (item.quantity > available) {
    issues.push({ code: 'insufficient_availability', available })
  }

  if (item.priceSeenEth !== nft.priceEth) {
    issues.push({
      code: 'price_changed',
      previous_price_eth: item.priceSeenEth,
      price_eth: nft.priceEth,
    })
  }

  return issues
}

export function toCartItemDto(item: CartItemRecord): CartItemDto | undefined {
  const nft = findNft(item.nftId)
  const edition = nft?.editions.find((candidate) => candidate.id === item.editionId)
  if (!nft || !edition) return undefined

  const summary = toNftSummaryDto(nft)

  return {
    id: item.id,
    nft: {
      id: nft.id,
      name: nft.name,
      token_id: nft.tokenId,
      thumbnail_url: summary.thumbnail_url,
      network: nft.network,
      status: summary.status,
      version: nft.version,
    },
    edition: { id: edition.id, label: edition.label, available: edition.available },
    quantity: item.quantity,
    max_quantity: itemLimit(nft, edition.id),
    unit_price_eth: nft.priceEth,
    line_total_eth: mulEthByInt(nft.priceEth, item.quantity),
    issues: issuesOf(item, nft),
  }
}

export function cartItemsOf(ownerKey: string): CartItemRecord[] {
  return getDb().carts[ownerKey] ?? []
}

export function toCartResponse(ownerKey: string) {
  return {
    items: cartItemsOf(ownerKey).flatMap((item) => {
      const dto = toCartItemDto(item)
      return dto ? [dto] : []
    }),
  }
}
