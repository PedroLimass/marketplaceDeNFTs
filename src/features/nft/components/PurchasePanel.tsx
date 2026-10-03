import { ShoppingCart } from 'lucide-react'

import type { NftDetail } from '@/features/catalog/types/catalog'
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { Button } from '@/shared/ui/button'

import { useBuyActions } from '../hooks/useBuyActions'
import { quantityHint } from '../hooks/quantityHint'
import type { PurchaseSelection } from '../hooks/usePurchaseSelection'
import { QuantityStepper } from './QuantityStepper'

export function DesktopPurchaseActions({
  nft,
  selection,
}: {
  nft: NftDetail
  selection: PurchaseSelection
}) {
  const { buyNow, pending } = useBuyActions(nft, selection)
  const hint = quantityHint(selection, nft.maxPerOrder)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <QuantityStepper
          quantity={selection.quantity}
          max={selection.maxQuantity}
          disabled={selection.soldOut}
          onIncrement={selection.increment}
          onDecrement={selection.decrement}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="lg"
            className="min-w-[130px] uppercase"
            disabled={selection.soldOut}
            loading={pending}
            onClick={buyNow}
          >
            Comprar
          </Button>
          <FavoriteButton nftId={nft.id} nftName={nft.name} className="h-12" />
        </div>
      </div>
      <p role="status" className="min-h-4 text-xs leading-4 text-text-secondary">
        {hint}
      </p>
    </div>
  )
}

export function MobileBuyBar({
  nft,
  selection,
  totalLabel,
}: {
  nft: NftDetail
  selection: PurchaseSelection
  totalLabel: string
}) {
  const { buyNow, addOnly, pending } = useBuyActions(nft, selection)
  const hint = quantityHint(selection, nft.maxPerOrder)

  return (
    <div className="sticky bottom-0 z-20 flex flex-col gap-4 border-t border-border bg-surface-card px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">Qtd.</span>
          <QuantityStepper
            quantity={selection.quantity}
            max={selection.maxQuantity}
            disabled={selection.soldOut}
            onIncrement={selection.increment}
            onDecrement={selection.decrement}
          />
        </div>
        <p className="text-base font-bold text-text-accent">
          <span className="sr-only">Total: </span>
          {totalLabel}
        </p>
      </div>
      <p role="status" className="-mt-2 min-h-4 text-xs leading-4 text-text-secondary">
        {hint}
      </p>
      <div className="flex gap-3">
        <Button
          type="button"
          size="lg"
          className="h-[60px] flex-1 rounded-[10px] text-base"
          disabled={selection.soldOut}
          loading={pending}
          onClick={buyNow}
        >
          Comprar NFT
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-label="Adicionar ao carrinho"
          className="size-[60px] rounded-full p-0"
          disabled={selection.soldOut || pending}
          onClick={addOnly}
        >
          <ShoppingCart aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </div>
  )
}
