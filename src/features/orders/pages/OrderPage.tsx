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

  useEffect(() => {
    if (!userId || !status || status === 'pending') return
    if (readAttempt(userId)?.orderId === orderId) clearAttempt()
  }, [userId, status, orderId])

  if (order.isPending) {
    return (
      <PageChrome>
        <OrderSkeleton />
      </PageChrome>
    )
  }

  if (order.isError) {
    return (
      <PageChrome>
        <OrderLoadError
          error={order.error}
          onRetry={() => {
            void order.refetch()
          }}
        />
      </PageChrome>
    )
  }

  if (order.data.status === 'confirmed') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-ink">
        <div className="flex min-h-dvh items-start justify-center px-4 py-10 md:pt-[166px] md:pb-24">
          <OrderReceipt order={order.data} />
        </div>
      </div>
    )
  }

  if (order.data.status === 'rejected') {
    return (
      <PageChrome>
        <OrderRejected order={order.data} />
      </PageChrome>
    )
  }

  return (
    <PageChrome>
      <OrderPending order={order.data} />
    </PageChrome>
  )
}

function PageChrome({ children }: { children: React.ReactNode }) {
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
      {children}
    </div>
  )
}
