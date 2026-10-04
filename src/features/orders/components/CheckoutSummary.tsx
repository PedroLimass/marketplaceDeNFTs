import { useEffect } from 'react'

import { CouponForm } from '@/features/cart/components/CouponForm'
import { couponStore, useAppliedCoupon } from '@/features/cart/coupon/couponStore'
import { useQuote } from '@/features/cart/hooks/useCart'
import type { CartItem } from '@/features/cart/types/cart'
import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'
import { useConnectWallet, useDisconnectWallet } from '@/features/wallets/hooks/useWallets'
import type { Wallet } from '@/features/wallets/types/wallet'
import { isApiError } from '@/infrastructure/http/errors'
import { formatEth } from '@/shared/lib/money'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import type { CheckoutPhase } from '../hooks/useCheckoutSubmit'
import { WalletPicker } from './WalletPicker'

function WalletConnection({ wallet, disabled }: { wallet: Wallet | undefined; disabled: boolean }) {
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  if (!wallet) return null

  const pending = connect.isPending || disconnect.isPending

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p role="status" className="text-sm text-text-secondary">
        {wallet.connected ? 'Carteira conectada' : 'Carteira desconectada'}
      </p>
      {wallet.connected ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || pending}
          loading={disconnect.isPending}
          onClick={() => {
            disconnect.mutate(wallet.id)
          }}
        >
          Desconectar
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          disabled={disabled || pending}
          loading={connect.isPending}
          onClick={() => {
            connect.mutate(wallet.id)
          }}
        >
          Conectar
        </Button>
      )}
    </div>
  )
}

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
      <div className="flex items-baseline justify-between gap-4 text-[15px] leading-5 text-text-primary">
        <dt>{label}</dt>
        <dd className="whitespace-nowrap text-lg leading-4">{children}</dd>
      </div>
      {hint ? <p className="text-center text-xs leading-4 text-text-accent">{hint}</p> : null}
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
  wallets: Wallet[]
  walletId: string
  network: NetworkId
  phase: CheckoutPhase
  submitting: boolean
  formId: string
  onSelectWallet: (walletId: string) => void

  onQuote: (quote: ReturnType<typeof useQuote>['data']) => void
}

export function CheckoutSummary({
  items,
  wallets,
  walletId,
  network,
  phase,
  submitting,
  formId,
  onSelectWallet,
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

  const selected = wallets.find((wallet) => wallet.id === walletId)
  const disconnected = selected !== undefined && !selected.connected
  const refreshing = quote.isFetching && !quote.isPending
  const blocked =
    hasIssues ||
    disconnected ||
    quote.isFetching ||
    quote.isPending ||
    quote.isError ||
    !data ||
    data.items.length === 0

  return (
    <aside aria-labelledby="resumo-pagamento" className="flex w-full flex-col gap-3 xl:w-[405px]">
      <h2 id="resumo-pagamento" className="text-[17px] leading-4 font-bold text-text-primary">
        Seus NFTs
      </h2>

      <div className="flex items-center justify-between text-base leading-4">
        <span className="font-bold text-foreground">NFTs</span>
        <span className="font-medium text-foreground">Subtotal</span>
      </div>
      <div className="border-t border-border-soft" />

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="grid grid-cols-[70px_minmax(0,1fr)_auto] items-center gap-x-2 bg-surface-card py-0 pr-3 pl-1 sm:grid-cols-[70px_minmax(0,1fr)_auto_auto] sm:gap-x-4"
          >
            <img
              src={item.nft.thumbnailUrl}
              alt=""
              width={70}
              height={70}
              className="size-[70px] shrink-0 rounded-lg object-cover"
            />
            <div className="flex min-w-0 flex-col gap-1.5 py-2">
              <span className="truncate text-base leading-4 font-bold text-text-primary">
                {item.nft.name}
              </span>
              <span className="text-sm leading-4 text-brand-secondary">
                ID do token: #{item.nft.tokenId}
              </span>
            </div>
            <span className="col-start-2 text-sm leading-4 text-text-secondary sm:col-start-auto">
              (x {item.quantity})
            </span>
            <span className="text-right text-lg leading-4 font-bold text-text-accent">
              {formatEth(item.lineTotalEth)}
            </span>
          </li>
        ))}
      </ul>

      <CouponForm
        appliedCode={appliedCode}
        network={network}
        collapsedLabel="Tem um código promocional? Aplique aqui"
      />

      <dl
        aria-busy={quote.isPending || refreshing}
        className={cn('flex flex-col gap-3 transition-opacity', refreshing && 'opacity-60')}
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
            <div className="flex items-baseline justify-between gap-4 border-t border-border-soft pt-3 text-base leading-4 font-bold text-text-primary">
              <dt>Total</dt>
              <dd className="text-lg text-text-accent">
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

      <WalletPicker
        wallets={wallets}
        value={walletId}
        disabled={submitting}
        onChange={onSelectWallet}
      />
      <WalletConnection wallet={selected} disabled={submitting} />

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          form={formId}
          size="lg"
          className="h-[45px] w-full rounded-lg text-[15px]"
          loading={submitting}
          disabled={blocked}
          aria-describedby="pagamento-bloqueio"
        >
          {phaseLabels[phase]}
        </Button>
        <p id="pagamento-bloqueio" className="text-xs leading-4 text-text-secondary">
          {hasIssues
            ? 'Resolva as pendências do carrinho para continuar.'
            : disconnected
              ? 'Conecte a carteira para continuar.'
              : ''}
        </p>
      </div>
    </aside>
  )
}
