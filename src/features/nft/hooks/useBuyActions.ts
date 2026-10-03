import { useNavigate } from '@tanstack/react-router'

import { describeCartError } from '@/features/cart/hooks/cartErrors'
import { useAddToCart } from '@/features/cart/hooks/useCart'
import type { NftDetail } from '@/features/catalog/types/catalog'
import { toast } from '@/shared/lib/toast'

import type { PurchaseSelection } from './usePurchaseSelection'

export function useBuyActions(nft: NftDetail, selection: PurchaseSelection) {
  const navigate = useNavigate()
  const addToCart = useAddToCart()

  const run = (onAdded: () => void) => {
    if (!selection.edition || selection.soldOut) return

    addToCart.mutate(
      { nftId: nft.id, editionId: selection.edition.id, quantity: selection.quantity },
      {
        onSuccess: onAdded,
        onError: (error) => {
          toast.error(describeCartError(error))
        },
      },
    )
  }

  return {
    pending: addToCart.isPending,
    /** Adiciona ao carrinho e segue para ele. */
    buyNow: () => {
      run(() => {
        void navigate({ to: '/cart' })
      })
    },
    /** Adiciona ao carrinho e fica na página. */
    addOnly: () => {
      run(() => {
        toast.success(`${nft.name} foi adicionado ao carrinho.`)
      })
    },
  }
}
