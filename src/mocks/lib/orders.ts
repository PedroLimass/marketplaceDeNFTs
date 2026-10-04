import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'
import type { OrderDto } from '@/features/orders/schemas/order.schemas'

import { getDb, mutateDb } from '../db/mockDb'
import type { OrderRecord } from '../db/types'
import { publish } from '../realtime/bus'
import { cartKeyOfUser } from './cart'
import { updateNft } from './nftMutations'

const EXPLORERS: Record<NetworkId, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}

const REJECTION = {
  code: 'payment_declined',
  message: 'O pagamento foi recusado pela carteira. Nenhum valor foi cobrado.',
}

export function newTransactionHash(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

export function findOrder(orderId: string): OrderRecord | undefined {
  return getDb().orders.find((order) => order.dto.id === orderId)
}

/** Devolve o estoque reservado por um pedido que não foi concluído. */
function releaseStock(record: OrderRecord): void {
  for (const line of record.purchased) {
    updateNft(line.nftId, (nft) => {
      const edition = nft.editions.find((candidate) => candidate.id === line.editionId)
      if (edition) edition.available += line.quantity
    })
  }
}

/** Remove do carrinho só o que foi comprado, preservando o que o usuário acrescentou depois. */
function clearPurchasedFromCart(record: OrderRecord): void {
  mutateDb((db) => {
    const key = cartKeyOfUser(record.userId)
    const cart = db.carts[key]
    if (!cart) return

    for (const line of record.purchased) {
      const entry = cart.find(
        (item) => item.nftId === line.nftId && item.editionId === line.editionId,
      )
      if (entry) entry.quantity -= line.quantity
    }
    db.carts[key] = cart.filter((item) => item.quantity > 0)
  })
}

/** Leva um pedido pendente ao estado final definido pelo cenário. É idempotente. */
export function resolveOrder(orderId: string): void {
  const current = findOrder(orderId)
  if (current?.dto.status !== 'pending') return

  const resolvedAt = new Date().toISOString()
  const confirmed = current.outcome === 'confirmed'

  mutateDb((db) => {
    const record = db.orders.find((order) => order.dto.id === orderId)
    if (record?.dto.status !== 'pending') return

    const hash = newTransactionHash()
    record.dto = {
      ...record.dto,
      status: confirmed ? 'confirmed' : 'rejected',
      version: record.dto.version + 1,
      transaction: confirmed
        ? { hash, explorer_url: `${EXPLORERS[record.dto.network]}${hash}` }
        : null,
      rejection: confirmed ? null : REJECTION,
      resolved_at: resolvedAt,
    }
  })

  if (confirmed) clearPurchasedFromCart(current)
  else releaseStock(current)

  publish({ kind: 'order', orderId, userId: current.userId })
}

/** Resolve os pedidos cujo prazo já passou; permite o mock "andar" mesmo com a aba fechada. */
export function resolveDueOrders(now = Date.now()): void {
  for (const order of getDb().orders) {
    if (order.dto.status === 'pending' && order.resolveAt <= now) resolveOrder(order.dto.id)
  }
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

/** Agenda a resolução enquanto a aba está aberta, para o evento em tempo real chegar na hora. */
export function scheduleOrderResolution(order: OrderRecord): void {
  const orderId = order.dto.id
  if (timers.has(orderId)) return

  timers.set(
    orderId,
    setTimeout(
      () => {
        timers.delete(orderId)
        resolveOrder(orderId)
      },
      Math.max(0, order.resolveAt - Date.now()),
    ),
  )
}

/** Retoma os pedidos pendentes de uma sessão anterior (por exemplo, depois de recarregar a página). */
export function schedulePendingOrders(): void {
  for (const order of getDb().orders) {
    if (order.dto.status === 'pending') scheduleOrderResolution(order)
  }
}

export const toOrderDto = (record: OrderRecord): OrderDto => record.dto
