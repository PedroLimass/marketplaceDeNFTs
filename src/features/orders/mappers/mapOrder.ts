import type { OrderDto } from '../schemas/order.schemas'
import type { Order } from '../types/order'

export function mapOrder(dto: OrderDto): Order {
  return {
    id: dto.id,
    status: dto.status,
    version: dto.version,
    items: dto.items.map((item) => ({
      nftId: item.nft_id,
      name: item.name,
      tokenId: item.token_id,
      imageUrl: item.image_url,
      editionLabel: item.edition_label,
      quantity: item.quantity,
      unitPriceEth: item.unit_price_eth,
      lineTotalEth: item.line_total_eth,
    })),
    subtotalEth: dto.subtotal_eth,
    discountEth: dto.discount_eth,
    networkFeeEth: dto.network_fee_eth,
    totalEth: dto.total_eth,
    network: dto.network,
    wallet: dto.wallet,
    collector: { displayName: dto.collector.display_name, email: dto.collector.email },
    transaction: dto.transaction
      ? { hash: dto.transaction.hash, explorerUrl: dto.transaction.explorer_url }
      : null,
    rejection: dto.rejection,
    createdAt: dto.created_at,
    resolvedAt: dto.resolved_at,
  }
}
