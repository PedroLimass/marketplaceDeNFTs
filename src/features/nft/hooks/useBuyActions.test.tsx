import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/infrastructure/http/errors'
import { toast } from '@/shared/lib/toast'

import type { NftDetail } from '@/features/catalog/types/catalog'
import type { PurchaseSelection } from './usePurchaseSelection'

const mutate = vi.fn()
const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

vi.mock('@/features/cart/hooks/useCart', () => ({
  useAddToCart: () => ({ mutate, isPending: false }),
}))

import { useBuyActions } from './useBuyActions'

const nft = { id: 'emerald-ape-042', name: 'Emerald Ape #042' } as NftDetail
const edition = { id: '1/50', label: '1/50', supply: 50, available: 40, status: 'open' as const }

const selection = (overrides: Partial<PurchaseSelection> = {}): PurchaseSelection => ({
  edition,
  quantity: 1,
  maxQuantity: 8,
  soldOut: false,
  selectEdition: () => undefined,
  increment: () => undefined,
  decrement: () => undefined,
  ...overrides,
})

describe('useBuyActions', () => {
  beforeEach(() => {
    mutate.mockReset()
    navigate.mockReset()
    toast.clear()
  })

  it('não chama a API quando a edição esgotou', () => {
    const { result } = renderHook(() =>
      useBuyActions(nft, selection({ soldOut: true, edition: undefined })),
    )

    result.current.buyNow()
    result.current.addOnly()

    expect(mutate).not.toHaveBeenCalled()
  })

  it('compra agora e vai ao carrinho', () => {
    const { result } = renderHook(() => useBuyActions(nft, selection()))

    result.current.buyNow()
    expect(mutate).toHaveBeenCalledWith(
      { nftId: nft.id, editionId: '1/50', quantity: 1 },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    )
    mutate.mock.calls[0]?.[1].onSuccess()
    expect(navigate).toHaveBeenCalledWith({ to: '/cart' })
  })

  it('só adiciona e avisa; em erro mostra a mensagem do carrinho', () => {
    const info = vi.spyOn(toast, 'success')
    const error = vi.spyOn(toast, 'error')
    const { result } = renderHook(() => useBuyActions(nft, selection()))

    result.current.addOnly()
    mutate.mock.calls[0]?.[1].onSuccess()
    expect(info).toHaveBeenCalledWith('Emerald Ape #042 foi adicionado ao carrinho.')

    mutate.mock.calls[0]?.[1].onError(new ApiError({ kind: 'network', message: 'offline' }))
    expect(error).toHaveBeenCalledWith(
      'Sem conexão com o servidor. Verifique sua internet e tente de novo.',
    )
  })
})
