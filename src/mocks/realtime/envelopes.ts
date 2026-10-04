import { getDb } from '../db/mockDb'
import { toNftSummaryDto } from '../lib/nftDto'
import { findOrder } from '../lib/orders'

export interface MockEnvelope {
  event_id: string
  type: string
  resource: { type: string; id: string }
  version: number
  occurred_at: string
  user_id?: string
  data: unknown
}

const newEventId = () => `evt_${crypto.randomUUID()}`

export function nftEnvelope(nftId: string): MockEnvelope | undefined {
  const nft = getDb().nfts.find((candidate) => candidate.id === nftId)
  if (!nft) return undefined

  const summary = toNftSummaryDto(nft)
  return {
    event_id: newEventId(),
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurred_at: new Date().toISOString(),
    data: {
      price_eth: summary.price_eth,
      available_quantity: summary.available_quantity,
      status: summary.status,
      editions: nft.editions.map((edition) => ({ id: edition.id, available: edition.available })),
    },
  }
}

export function orderEnvelope(orderId: string): MockEnvelope | undefined {
  const order = findOrder(orderId)
  if (!order) return undefined

  const { dto } = order
  return {
    event_id: newEventId(),
    type: 'order.updated',
    resource: { type: 'order', id: dto.id },
    version: dto.version,
    occurred_at: new Date().toISOString(),
    user_id: order.userId,
    data: { status: dto.status, transaction: dto.transaction, rejection: dto.rejection },
  }
}
