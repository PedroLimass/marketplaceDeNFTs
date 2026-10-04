import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { cartKeys } from '@/features/cart/api/cartKeys'
import type { Quote } from '@/features/cart/types/cart'
import { connectWallet } from '@/features/wallets/api/walletsApi'
import type { Wallet } from '@/features/wallets/types/wallet'
import { isApiError } from '@/infrastructure/http/errors'

import { createOrder, fetchOrder, fetchPendingOrders, orderKeys } from '../api/ordersApi'
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

/** Erros em que o servidor pode ter criado o pedido sem a resposta chegar. */
const isUnknownOutcome = (error: unknown): boolean =>
  isApiError(error) && ['timeout', 'network', 'transient'].includes(error.kind)

/**
 * Cria o pedido com chave de idempotência persistida. A mesma tentativa (mesmo carrinho,
 * carteira e dados) reaproveita a chave e o corpo originais, então cliques repetidos,
 * timeouts e recarregamentos nunca geram um segundo pedido.
 */
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
        // A tentativa anterior pode ter virado pedido sem o cliente saber: confere antes de criar outro.
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

        const [pending] = await fetchPendingOrders(new AbortController().signal).catch(() => [])
        if (!pending) throw error
        saveAttempt({ ...current, orderId: pending.id })
        return pending
      }
    },
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order)
    },
    onError: (error) => {
      // Falhas definitivas encerram a tentativa. `quote_stale` espera a confirmação do usuário
      // (ver `acknowledgeStale`) e falhas de comunicação mantêm a chave para o reenvio.
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
