import { Link } from '@tanstack/react-router'

import { isApiError } from '@/infrastructure/http/errors'
import { formatEth } from '@/shared/lib/money'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { useEffect } from 'react'

import { couponStore, useAppliedCoupon } from '../coupon/couponStore'
import { useQuote } from '../hooks/useCart'
import type { CartItem } from '../types/cart'
import { CouponForm } from './CouponForm'
import { toast } from '@/shared/lib/toast'

function Row({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4 text-sm leading-5 text-text-primary">
        <dt>{label}</dt>
        <dd className="whitespace-nowrap">{children}</dd>
      </div>
      {hint ? <p className="text-right text-xs leading-4 text-text-secondary">{hint}</p> : null}
    </div>
  )
}

export function CartSummary({ items }: { items: CartItem[] }) {
  const appliedCode = useAppliedCoupon()
  const quote = useQuote(appliedCode, 'ethereum')
  const hasIssues = items.some((item) => item.issues.length > 0)

  const couponRejected =
    appliedCode !== undefined &&
    quote.isError &&
    isApiError(quote.error) &&
    quote.error.kind === 'validation'
  useEffect(() => {
    if (couponRejected) {
      couponStore.clear()
      toast.error(`O cupom ${appliedCode} não é mais válido e foi removido.`)
    }
  }, [couponRejected, appliedCode])

  const data = quote.data
  const refreshing = quote.isFetching && !quote.isPending
  const blocked = hasIssues || quote.isPending || quote.isError || !data || data.items.length === 0

  return (
    <aside aria-labelledby="resumo-titulo" className="flex flex-col gap-6">
      <h2
        id="resumo-titulo"
        className="border-b border-border-soft pb-3 text-[15px] leading-4 font-bold text-text-primary"
      >
        Resumo da carteira
      </h2>

      <CouponForm appliedCode={appliedCode} network="ethereum" />

      <dl
        aria-busy={quote.isPending || refreshing}
        className={cn('flex flex-col gap-4 transition-opacity', refreshing && 'opacity-60')}
      >
        {data ? (
          <>
            <Row label="Subtotal">{formatEth(data.subtotalEth)}</Row>
            <Row label={data.coupon?.label ?? 'Desconto do lançamento'}>
              (-) {formatEth(data.discountEth)}
            </Row>
            <Row label="Taxa de rede" hint="Taxa estimada">
              {formatEth(data.networkFeeEth, { minFractionDigits: 3 })}
            </Row>
            <div className="flex items-baseline justify-between gap-4 border-t border-border-soft pt-4 text-base leading-4 font-bold text-text-primary">
              <dt>Total</dt>
              <dd className="text-text-accent">
                {formatEth(data.totalEth, { minFractionDigits: 3 })}
              </dd>
            </div>
          </>
        ) : (
          <>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-5 w-full" />
          </>
        )}
      </dl>

      {quote.isError && !couponRejected ? (
        <p role="alert" className="text-sm text-text-coral">
          Não foi possível calcular os valores.{' '}
          <button
            type="button"
            className="cursor-pointer underline outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => {
              void quote.refetch()
            }}
          >
            Tentar novamente
          </button>
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        <Button
          asChild={!blocked}
          size="lg"
          className="w-full"
          disabled={blocked}
          aria-describedby="resumo-bloqueio"
        >
          {blocked ? 'Conectar e finalizar' : <Link to="/checkout">Conectar e finalizar</Link>}
        </Button>
        <p id="resumo-bloqueio" className="sr-only">
          {hasIssues ? 'Resolva as pendências do carrinho para continuar.' : ''}
        </p>
        <Link
          to="/"
          hash="catalogo"
          className={buttonVariants({ variant: 'link', className: 'self-center text-sm' })}
        >
          Continuar explorando
        </Link>
      </div>
    </aside>
  )
}
