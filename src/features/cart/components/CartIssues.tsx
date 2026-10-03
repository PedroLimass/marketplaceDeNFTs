import { TriangleAlert } from 'lucide-react'

import { toast } from '@/shared/lib/toast'
import { formatEth } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'

import { describeCartError } from '../hooks/cartErrors'
import { useRemoveCartItem, useUpdateCartItem } from '../hooks/useCart'
import type { CartItem } from '../types/cart'

function IssueRow({ children, action }: { children: React.ReactNode; action: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-5 text-foreground">{children}</p>
      {action}
    </li>
  )
}

/**
 * Mudanças de preço e disponibilidade encontradas no carrinho. É uma região `role="status"`,
 * então leitores de tela anunciam quando uma alteração (inclusive em tempo real) aparece.
 * Enquanto houver pendências, o pagamento fica bloqueado (ver `CartSummary`).
 */
export function CartIssues({ items }: { items: CartItem[] }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()

  const onError = (error: unknown) => {
    toast.error(describeCartError(error))
  }

  const rows = items.flatMap((item) =>
    item.issues.map((issue) => {
      switch (issue.code) {
        case 'price_changed':
          return (
            <IssueRow
              key={`${item.id}-price`}
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={update.isPending}
                  onClick={() => {
                    update.mutate({ itemId: item.id, acceptPrice: true }, { onError })
                  }}
                >
                  Aceitar novo preço
                </Button>
              }
            >
              O preço de <strong>{item.nft.name}</strong> mudou de{' '}
              {formatEth(issue.previousPriceEth)} para {formatEth(issue.priceEth)}.
            </IssueRow>
          )
        case 'insufficient_availability':
          return (
            <IssueRow
              key={`${item.id}-stock`}
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={update.isPending}
                  onClick={() => {
                    update.mutate({ itemId: item.id, quantity: issue.available }, { onError })
                  }}
                >
                  Ajustar para {issue.available}
                </Button>
              }
            >
              Só restam {issue.available} unidade(s) da edição {item.edition.label} de{' '}
              <strong>{item.nft.name}</strong>, e o carrinho tem {item.quantity}.
            </IssueRow>
          )
        case 'sold_out':
          return (
            <IssueRow
              key={`${item.id}-soldout`}
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={remove.isPending}
                  onClick={() => {
                    remove.mutate(item.id, { onError })
                  }}
                >
                  Remover do carrinho
                </Button>
              }
            >
              A edição {item.edition.label} de <strong>{item.nft.name}</strong> esgotou.
            </IssueRow>
          )
      }
    }),
  )

  return (
    <div role="status" aria-live="polite">
      {rows.length > 0 ? (
        <div className="flex gap-3 rounded-lg border border-text-coral bg-surface-card p-4">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-text-coral" />
          <div className="flex flex-1 flex-col gap-3">
            <p className="text-sm font-bold text-text-primary">
              Revise seu carrinho antes de pagar
            </p>
            <ul className="flex flex-col gap-3">{rows}</ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}
