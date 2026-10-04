import { Link } from '@tanstack/react-router'
import { TriangleAlert } from 'lucide-react'

import { isApiError } from '@/infrastructure/http/errors'
import { formatEth } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'

export interface StaleChange {
  from: string
  to: string
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-lg border border-text-coral bg-surface-card p-4 text-sm leading-5 text-foreground"
    >
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-text-coral" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">{children}</div>
    </div>
  )
}

interface CheckoutNoticesProps {
  error: unknown
  stale: StaleChange | null
  onAcknowledgeStale: () => void
}

/** Explica a falha da última tentativa de compra e o que o usuário pode fazer a respeito. */
export function CheckoutNotices({ error, stale, onAcknowledgeStale }: CheckoutNoticesProps) {
  if (stale) {
    return (
      <Notice>
        <p className="font-bold text-text-primary">Os valores mudaram desde a última conferência</p>
        <p>
          O total passou de {formatEth(stale.from, { minFractionDigits: 3 })} para{' '}
          {formatEth(stale.to, { minFractionDigits: 3 })}. Nada foi cobrado. Confira os novos
          valores para continuar.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={onAcknowledgeStale}>
          Ver novos valores
        </Button>
      </Notice>
    )
  }

  if (!isApiError(error)) {
    return error ? (
      <Notice>
        <p>Não foi possível concluir a compra. Tente novamente.</p>
      </Notice>
    ) : null
  }

  if (error.code === 'wallet_connection_refused') {
    return (
      <Notice>
        <p className="font-bold text-text-primary">A carteira recusou a conexão</p>
        <p>Autorize a conexão na carteira e confirme de novo, ou escolha outra carteira.</p>
      </Notice>
    )
  }

  if (error.code === 'insufficient_availability') {
    return (
      <Notice>
        <p className="font-bold text-text-primary">Alguns itens não estão mais disponíveis</p>
        <p>
          A disponibilidade mudou durante a compra. Nada foi cobrado.{' '}
          <Link to="/cart" className="text-text-accent underline underline-offset-4">
            Revise o carrinho
          </Link>
          .
        </p>
      </Notice>
    )
  }

  if (error.kind === 'timeout' || error.kind === 'network' || error.kind === 'transient') {
    return (
      <Notice>
        <p className="font-bold text-text-primary">Não recebemos a resposta do servidor</p>
        <p>
          Seu pedido pode ter sido criado. Ao tentar novamente, reenviamos a mesma tentativa, então
          a compra não será feita duas vezes.
        </p>
      </Notice>
    )
  }

  return (
    <Notice>
      <p>{error.message}</p>
    </Notice>
  )
}
