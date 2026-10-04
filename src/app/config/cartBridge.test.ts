import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { notifySessionStarted } from '@/features/auth/session/sessionEvents'
import type { AuthResult } from '@/features/auth/types/auth'
import { cartKeys } from '@/features/cart/api/cartKeys'
import { toast } from '@/shared/lib/toast'

const mergeGuestCart = vi.fn()

vi.mock('@/features/cart/api/cartApi', () => ({
  mergeGuestCart: () => mergeGuestCart(),
}))

import { connectCartToSession } from './cartBridge'

const result = {
  session: { user: { id: 'usr_1' } },
  accessToken: 'tok',
} as AuthResult

describe('connectCartToSession', () => {
  afterEach(() => {
    toast.clear()
  })

  it('grava o carrinho unido e avisa quando a quantidade foi limitada', async () => {
    mergeGuestCart.mockResolvedValue({
      items: [{ id: 'ci_1' }],
      adjusted: [{ nftId: 'n1', name: 'Emerald Ape #042', requested: 5, applied: 2 }],
    })
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const stop = connectCartToSession(queryClient)

    const info = vi.spyOn(toast, 'info')
    notifySessionStarted(queryClient, result)
    await vi.waitFor(() => {
      expect(queryClient.getQueryData(cartKeys.items())).toEqual([{ id: 'ci_1' }])
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: cartKeys.quotes() })
    expect(info).toHaveBeenCalledWith(
      'A quantidade de Emerald Ape #042 foi ajustada para 2 pela disponibilidade.',
    )

    stop()
  })

  it('invalida o carrinho se a união falhar', async () => {
    mergeGuestCart.mockRejectedValue(new Error('rede'))
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const stop = connectCartToSession(queryClient)

    notifySessionStarted(queryClient, result)
    await vi.waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({ queryKey: cartKeys.items() })
    })

    stop()
  })
})
