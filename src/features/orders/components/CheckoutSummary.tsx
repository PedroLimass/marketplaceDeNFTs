import { useEffect } from 'react'

import { CouponForm } from '@/features/cart/components/CouponForm'
import { couponStore, useAppliedCoupon } from '@/features/cart/coupon/couponStore'
import { useQuote } from '@/features/cart/hooks/useCart'
import type { CartItem } from '@/features/cart/types/cart'
import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'
import { isApiError } from '@/infrastructure/http/errors'
import { formatEth } from '@/shared/lib/money'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import type { CheckoutPhase } from '../hooks/useCheckoutSubmit'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm leading-5 text-text-primary">
      <dt>{label}</dt>
      <dd className="whitespace-nowrap">{children}</dd>
    </div>
  )
}

const phaseLabels: Record<CheckoutPhase, string> = {
  idle: 'Confirmar compra',
  connecting: 'Conectando a carteira…',
  sending: 'Enviando pedido…',
}

interface CheckoutSummaryProps {
  items: CartItem[]
  network: NetworkId
  phase: CheckoutPhase
  submitting: boolean
  formId: string
  /** Informa a cotação vigente para o formulário montar o pedido. */
  onQuote: (quote: ReturnType<typeof useQuote>['data']) => void
}

export function CheckoutSummary({
  items,
  network,
  phase,
  submitting,
  formId,
  onQuote,
}: CheckoutSummaryProps) {
  const appliedCode = useAppliedCoupon()
  const quote = useQuote(appliedCode, network)
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
  useEffect(() => {
    onQuote(data)
  }, [data, onQuote])

  const refreshing = quote.isFetching && !quote.isPending
  // Enquanto a cotação é recalculada, a que está na tela pode estar desatualizada.
  const blocked =
    hasIssues ||
    quote.isFetching ||
    quote.isPending ||
    quote.isError ||
    !data ||
    data.items.length === 0

  return (
    <aside aria-labelledby="resumo-pagamento" className="flex flex-col gap-6">
      <h2
        id="resumo-pagamento"
        className="border-b border-border-soft pb-3 text-[15px] leading-4 font-bold text-text-primary"
      >
        Resumo da compra
      </h2>

      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <img
              src={item.nft.thumbnailUrl}
              alt=""
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-md object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-sm leading-4 font-medium text-text-primary">
                {item.nft.name}
              </span>
              <span className="text-xs leading-4 text-text-secondary">
                (x {item.quantity}) · Edição {item.edition.label}
              </span>
            </div>
            <span className="text-sm whitespace-nowrap text-text-primary">
              {formatEth(item.lineTotalEth)}
            </span>
          </li>
        ))}
      </ul>

      <CouponForm appliedCode={appliedCode} network={network} />

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
            <Row label="Taxa de rede">
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

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          form={formId}
          size="lg"
          className="w-full"
          loading={submitting}
          disabled={blocked}
          aria-describedby="pagamento-bloqueio"
        >
          {phaseLabels[phase]}
        </Button>
        <p id="pagamento-bloqueio" className="text-xs leading-4 text-text-secondary">
          {hasIssues ? 'Resolva as pendências do carrinho para continuar.' : ''}
        </p>
      </div>
    </aside>
  )
}
