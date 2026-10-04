import type { QueryClient } from '@tanstack/react-query'

import { onSessionStarted } from '@/features/auth/session/sessionEvents'
import { mergeGuestCart } from '@/features/cart/api/cartApi'
import { cartKeys } from '@/features/cart/api/cartKeys'
import { toast } from '@/shared/lib/toast'

export function connectCartToSession(queryClient: QueryClient): () => void {
  return onSessionStarted(() => {
    void mergeGuestCart()
      .then(({ items, adjusted }) => {
        queryClient.setQueryData(cartKeys.items(), items)
        void queryClient.invalidateQueries({ queryKey: cartKeys.quotes() })

        for (const entry of adjusted) {
          toast.info(
            `A quantidade de ${entry.name} foi ajustada para ${String(entry.applied)} pela disponibilidade.`,
          )
        }
      })
      .catch(() => {
        void queryClient.invalidateQueries({ queryKey: cartKeys.items() })
      })
  })
}
