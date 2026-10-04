import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { cartKeys } from '@/features/cart/api/cartKeys'
import type { Quote } from '@/features/cart/types/cart'
import { connectWallet } from '@/features/wallets/api/walletsApi'
import type { Wallet } from '@/features/wallets/types/wallet'
import { isApiError } from '@/infrastructure/http/errors'

import {
  createOrder,
  fetchOrder,
  fetchOrders,
  fetchPendingOrders,
  orderKeys,
} from '../api/ordersApi'
import type { CreateOrderRequest } from '../schemas/order.schemas'
import {
  clearAttempt,
  newIdempotencyKey,
  readAttempt,
  saveAttempt,
  type CheckoutAttempt,
} from '../storage/checkoutAttempt'
import type { Order } from '../types/order'

export type CheckoutPhase = 'idle' | 'connecting' | 'sending'

export interface CheckoutInput {
  userId: string
  quote: Quote
  wallet: Wallet
  collector: CreateOrderRequest['collector']
  note: string | undefined
}

const intentOf = ({ quote, wallet, collector, note }: CheckoutInput): string =>
  JSON.stringify({
    wallet: wallet.id,
    network: wallet.network,
    coupon: quote.coupon?.code ?? null,
    items: quote.items.map((item) => [item.nftId, item.editionId, item.quantity]),
    collector,
    note: note ?? null,
  })

const bodyOf = ({ quote, wallet, collector, note }: CheckoutInput): CreateOrderRequest => ({
  quote_id: quote.id,
  wallet_id: wallet.id,
  network: wallet.network,
  collector,
  ...(note ? { note } : {}),
})

const isUnknownOutcome = (error: unknown): boolean =>
  isApiError(error) && ['timeout', 'network', 'transient'].includes(error.kind)

export function useCheckoutSubmit(onPhase?: (phase: CheckoutPhase) => void) {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<CheckoutPhase>('idle')

  const move = (next: CheckoutPhase) => {
    setPhase(next)
    onPhase?.(next)
  }

  const mutation = useMutation({
    mutationFn: async (input: CheckoutInput): Promise<Order> => {
      const intent = intentOf(input)
      let attempt = readAttempt(input.userId)

      if (attempt?.orderId && attempt.intent === intent) {
        const existing = await fetchOrder(attempt.orderId, new AbortController().signal)
        if (existing.status !== 'rejected') return existing
        clearAttempt()
        attempt = null
      }

      if (attempt && attempt.intent !== intent) {
        const [pending] = await fetchPendingOrders(new AbortController().signal)
        if (pending && !attempt.orderId) {
          saveAttempt({ ...attempt, orderId: pending.id })
          return pending
        }
        attempt = null
      }

      const current: CheckoutAttempt = attempt ?? {
        userId: input.userId,
        key: newIdempotencyKey(),
        intent,
        body: bodyOf(input),
      }
      if (!attempt) saveAttempt(current)

      move('connecting')
      await connectWallet(input.wallet.id)

      move('sending')
      try {
        const order = await createOrder(current.body, current.key)
        saveAttempt({ ...current, orderId: order.id })
        return order
      } catch (error) {
        if (!isUnknownOutcome(error)) throw error

        const [recent] = await fetchOrders(new AbortController().signal).catch(() => [])
        if (!recent) throw error
        saveAttempt({ ...current, orderId: recent.id })
        return recent
      }
    },
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order)
    },
    onError: (error) => {
      const definitive =
        isApiError(error) &&
        error.code !== 'quote_stale' &&
        ['validation', 'conflict', 'forbidden', 'not_found'].includes(error.kind)
      if (definitive) clearAttempt()

      if (isApiError(error) && ['conflict', 'validation'].includes(error.kind)) {
        void queryClient.invalidateQueries({ queryKey: cartKeys.all })
      }
    },
    onSettled: () => {
      move('idle')
    },
  })

  return { ...mutation, phase }
}
