import { screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resetGuestIdCache } from '@/infrastructure/http/guestId'
import { resetHttpHooks } from '@/infrastructure/http/interceptors'
import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'
import { mutateDb } from '@/mocks/db/mockDb'
import { handlers } from '@/mocks/handlers'
import { setScenario } from '@/mocks/scenarios/current'
import { toast } from '@/shared/lib/toast'
import { renderAppAt } from '@/test/renderApp'

import { couponStore } from '../coupon/couponStore'

const server = setupServer(...handlers)

async function addEmeraldApe(user: Awaited<ReturnType<typeof renderAppAt>>['user']) {
  await screen.findByRole('heading', { level: 1, name: 'Emerald Ape #042' })
  await user.click(screen.getByRole('button', { name: 'Comprar' }))
  return screen.findByRole('table', { name: 'NFTs no carrinho' })
}

describe('Carrinho', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(async () => {
    await initMockDb()
    await resetMockDb()
    setScenario('default')
    window.localStorage.clear()
    window.sessionStorage.clear()
    couponStore.clear()
    resetGuestIdCache()
    toast.clear()
  })

  afterEach(() => {
    server.resetHandlers()
    resetHttpHooks()
  })

  afterAll(() => {
    server.close()
  })

  it('mostra o estado vazio com link para o catálogo', async () => {
    await renderAppAt('/cart')

    expect(await screen.findByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Explorar NFTs' })).toBeInTheDocument()
  })

  it('altera a quantidade, recalcula o resumo e remove o item', async () => {
    const { user } = await renderAppAt('/nfts/emerald-ape-042')
    const table = await addEmeraldApe(user)

    const summary = await screen.findByRole('complementary', { name: 'Resumo da carteira' })
    await waitFor(() => {
      expect(within(summary).getByText('Subtotal')).toBeInTheDocument()
    })
    const before = summary.textContent

    await user.click(within(table).getByRole('button', { name: /Aumentar quantidade/ }))
    await waitFor(() => {
      expect(within(table).getByRole('group', { name: /Quantidade de/ })).toHaveTextContent('2')
    })
    await waitFor(() => {
      expect(summary.textContent).not.toBe(before)
    })

    await user.click(within(table).getByRole('button', { name: /Remover Emerald Ape #042/ }))
    expect(await screen.findByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })

  it('aplica um cupom válido e mostra o erro de um cupom inválido', async () => {
    const { user } = await renderAppAt('/nfts/emerald-ape-042')
    await addEmeraldApe(user)

    const input = await screen.findByLabelText('Código promocional')
    await user.type(input, 'NAOEXISTE')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/cupom|código/i)
    expect(couponStore.get()).toBeUndefined()

    await user.clear(input)
    await user.type(input, 'lancamento10')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(await screen.findByText('LANCAMENTO10')).toBeInTheDocument()
    expect(couponStore.get()).toBe('LANCAMENTO10')
  })

  it('avisa e bloqueia o pagamento quando o preço muda', async () => {
    const { user, queryClient } = await renderAppAt('/nfts/emerald-ape-042')
    await addEmeraldApe(user)

    mutateDb((draft) => {
      const nft = draft.nfts.find((candidate) => candidate.id === 'emerald-ape-042')
      if (nft) nft.priceEth = '1.50'
    })
    await queryClient.invalidateQueries({ queryKey: ['cart'] })

    await screen.findByText(/Revise seu carrinho antes de pagar/)
    expect(screen.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Aceitar novo preço' }))
    await waitFor(() => {
      expect(screen.queryByText(/Revise seu carrinho antes de pagar/)).not.toBeInTheDocument()
    })
  })

  it('mantém o carrinho do visitante ao entrar na conta', async () => {
    const { user, router } = await renderAppAt('/nfts/emerald-ape-042')
    await addEmeraldApe(user)

    await router.navigate({ to: '/login' })
    await user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
    await user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })
    await router.navigate({ to: '/cart' })
    const table = await screen.findByRole('table', { name: 'NFTs no carrinho' })
    expect(within(table).getByRole('link', { name: 'Emerald Ape #042' })).toBeInTheDocument()
  })
})
