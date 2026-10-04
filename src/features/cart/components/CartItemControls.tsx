import { Minus, Plus, Trash2 } from 'lucide-react'

import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'

import { describeCartError } from '../hooks/cartErrors'
import { useRemoveCartItem, useUpdateCartItem } from '../hooks/useCart'
import type { CartItem } from '../types/cart'

export function CartItemControls({ item }: { item: CartItem }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending

  const setQuantity = (quantity: number) => {
    update.mutate(
      { itemId: item.id, quantity },
      {
        onError: (error) => {
          toast.error(describeCartError(error))
        },
      },
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div
        role="group"
        aria-label={`Quantidade de ${item.nft.name}`}
        className="flex items-center gap-2"
      >
        <Button
          type="button"
          size="icon-sm"
          aria-label={`Diminuir quantidade de ${item.nft.name}`}
          className="rounded-full"
          disabled={busy || item.quantity <= 1}
          onClick={() => {
            setQuantity(item.quantity - 1)
          }}
        >
          <Minus aria-hidden="true" />
        </Button>
        <span
          aria-live="polite"
          className="min-w-5 text-center text-base font-bold text-text-primary"
        >
          {item.quantity}
        </span>
        <Button
          type="button"
          size="icon-sm"
          aria-label={`Aumentar quantidade de ${item.nft.name}`}
          className="rounded-full"
          disabled={busy || item.quantity >= item.maxQuantity}
          onClick={() => {
            setQuantity(item.quantity + 1)
          }}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Remover ${item.nft.name} do carrinho`}
        disabled={busy}
        loading={remove.isPending}
        onClick={() => {
          remove.mutate(item.id, {
            onSuccess: () => {
              toast.info(`${item.nft.name} foi removido do carrinho.`)
            },
            onError: (error) => {
              toast.error(describeCartError(error))
            },
          })
        }}
      >
        {remove.isPending ? null : <Trash2 aria-hidden="true" />}
      </Button>
    </div>
  )
}
