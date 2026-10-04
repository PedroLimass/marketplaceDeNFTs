import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'

import { OrderReceipt } from '../components/OrderReceipt'
import {
  OrderLoadError,
  OrderPending,
  OrderRejected,
  OrderSkeleton,
} from '../components/OrderStates'
import { useOrder } from '../hooks/useOrders'
import { clearAttempt, readAttempt } from '../storage/checkoutAttempt'
import { useSession } from '@/features/auth/hooks/useSession'

export function OrderPage({ orderId }: { orderId: string }) {
  const order = useOrder(orderId)
  const session = useSession()
  const userId = session.data?.user.id
  const status = order.data?.status

  useEffect(() => {
    document.title = 'Pedido · Kurio'
    return () => {
      document.title = 'Kurio — Marketplace de NFTs'
    }
  }, [])

  // Com o resultado final em mãos, a tentativa de compra termina e uma nova usa outra chave.
  useEffect(() => {
    if (!userId || !status || status === 'pending') return
    if (readAttempt(userId)?.orderId === orderId) clearAttempt()
  }, [userId, status, orderId])

  let body: React.ReactNode
  if (order.isPending) body = <OrderSkeleton />
  else if (order.isError) {
    body = (
      <OrderLoadError
        error={order.error}
        onRetry={() => {
          void order.refetch()
        }}
      />
    )
  } else if (order.data.status === 'confirmed') body = <OrderReceipt order={order.data} />
  else if (order.data.status === 'rejected') body = <OrderRejected order={order.data} />
  else body = <OrderPending order={order.data} />

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-7 px-4 pt-8 pb-24 md:px-8 xl:px-0">
      <nav aria-label="Trilha de navegação">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
          <li>
            <Link
              to="/"
              className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
            >
              Início
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            Pedido
          </li>
        </ol>
      </nav>
      {body}
    </div>
  )
}
