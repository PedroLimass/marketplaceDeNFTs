import { Link } from '@tanstack/react-router'
import { CircleAlert, LoaderCircle } from 'lucide-react'

import { isApiError } from '@/infrastructure/http/errors'
import { Button, buttonVariants } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

import type { Order } from '../types/order'

const cardClass =
  'mx-auto flex w-full max-w-[578px] flex-col items-center gap-5 rounded-2xl border border-border bg-surface-card px-6 py-12 text-center sm:px-10'

export function OrderSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando pedido"
      className="mx-auto flex w-full max-w-[578px] flex-col gap-6"
    >
      <Skeleton className="h-20 w-20 self-center rounded-full" />
      <Skeleton className="h-6 w-3/4 self-center" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

export function OrderPending({ order }: { order: Order }) {
  return (
    <section aria-labelledby="pedido-pendente" className={cardClass}>
      <LoaderCircle aria-hidden="true" className="size-12 text-primary motion-safe:animate-spin" />
      <h1 id="pedido-pendente" className="text-lg font-bold text-text-primary">
        Aguardando a confirmação na rede
      </h1>
      <div role="status" className="flex flex-col gap-2 text-sm text-text-secondary">
        <p>
          Enviamos seu pedido para a carteira {order.wallet.label}. Esta tela atualiza sozinha
          quando a transação for confirmada.
        </p>
        <p>Pode recarregar a página: o pedido continua sendo acompanhado.</p>
      </div>
    </section>
  )
}

export function OrderRejected({ order }: { order: Order }) {
  return (
    <section aria-labelledby="pedido-recusado" className={cardClass}>
      <CircleAlert aria-hidden="true" className="size-12 text-text-coral" />
      <h1 id="pedido-recusado" className="text-lg font-bold text-text-primary">
        Não foi possível concluir a compra
      </h1>
      <p role="alert" className="text-sm text-text-secondary">
        {order.rejection?.message ?? 'O pedido foi recusado.'} Seus NFTs continuam no carrinho.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/checkout" className={buttonVariants()}>
          Tentar novamente
        </Link>
        <Link to="/cart" className={buttonVariants({ variant: 'outline' })}>
          Voltar ao carrinho
        </Link>
      </div>
    </section>
  )
}

export function OrderLoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const notFound = isApiError(error) && error.kind === 'not_found'

  return (
    <section role="alert" className={cardClass}>
      <h1 className="text-lg font-bold text-text-primary">
        {notFound ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}
      </h1>
      <p className="max-w-md text-sm text-text-secondary">
        {notFound
          ? 'Este pedido não existe ou pertence a outra conta.'
          : isApiError(error)
            ? error.message
            : 'Tente novamente em instantes.'}
      </p>
      {notFound ? (
        <Link to="/" className={buttonVariants()}>
          Voltar ao início
        </Link>
      ) : (
        <Button type="button" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </section>
  )
}
