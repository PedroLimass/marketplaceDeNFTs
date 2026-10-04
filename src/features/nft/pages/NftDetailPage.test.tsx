import { screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resetHttpHooks } from '@/infrastructure/http/interceptors'
import { resetGuestIdCache } from '@/infrastructure/http/guestId'
import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'
import { handlers } from '@/mocks/handlers'
import { setScenario } from '@/mocks/scenarios/current'
import { toast } from '@/shared/lib/toast'
import { stubMatchMedia } from '@/test/matchMedia'
import { renderAppAt } from '@/test/renderApp'

const server = setupServer(...handlers)

describe('Detalhes do NFT', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(async () => {
    await initMockDb()
    await resetMockDb()
    setScenario('default')
    window.localStorage.clear()
    window.sessionStorage.clear()
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

  it('abre direto pela URL e mostra os dados do NFT', async () => {
    await renderAppAt('/nfts/emerald-ape-042')

    expect(await screen.findByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    expect(screen.getByText('ID do token:')).toBeInTheDocument()
    expect(document.title).toBe('Emerald Ape #042 · Kurio')
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('mostra a página de NFT não encontrado para um id inexistente', async () => {
    await renderAppAt('/nfts/nao-existe')

    expect(await screen.findByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Voltar ao catálogo' })).toBeInTheDocument()
  })

  it('leva ao detalhe a partir do cartão do catálogo', async () => {
    const { user, router } = await renderAppAt('/')
    const link = await screen.findByRole('link', { name: 'Emerald Ape #042' })

    await user.click(link)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/nfts/emerald-ape-042')
    })
  })

  it('limita a quantidade ao estoque da edição escolhida', async () => {
    const { user } = await renderAppAt('/nfts/emerald-ape-042')
    await screen.findByRole('heading', { level: 1, name: 'Emerald Ape #042' })

    const group = screen.getByRole('radiogroup')
    await user.click(within(group).getByRole('radio', { name: /1\/10/ }))

    const increase = screen.getByRole('button', { name: 'Aumentar quantidade' })
    for (let i = 0; i < 12; i += 1) {
      if (increase.hasAttribute('disabled')) break
      await user.click(increase)
    }

    expect(increase).toBeDisabled()
    expect(screen.getByRole('group', { name: 'Quantidade' })).toHaveTextContent('8')

    await user.click(within(group).getByRole('radio', { name: /1\/1(?!\d|\/)/ }))
    expect(screen.getByRole('group', { name: 'Quantidade' })).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()
  })

  it('leva ao carrinho depois de comprar e mostra o item', async () => {
    const { user, router } = await renderAppAt('/nfts/emerald-ape-042')
    await screen.findByRole('heading', { level: 1, name: 'Emerald Ape #042' })

    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade' }))
    await user.click(screen.getByRole('button', { name: 'Comprar' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/cart')
    })
    const table = await screen.findByRole('table', { name: 'NFTs no carrinho' })
    expect(within(table).getByRole('link', { name: 'Emerald Ape #042' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Carrinho, 2 item(ns)' })).toBeInTheDocument()
  })

  it('desfaz o favorito e avisa quando a API falha', async () => {
    const { user } = await renderAppAt('/login?redirect=/nfts/emerald-ape-042')
    await user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
    await user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    const favorite = await screen.findByRole('button', { name: /favorit/i })
    expect(favorite).toHaveAttribute('aria-pressed', 'false')

    setScenario('server-error')
    await user.click(favorite)

    expect(await screen.findByText(/Não foi possível adicionar aos favoritos/)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /favorit/i })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })
  })

  it('mostra o layout mobile, adiciona ao carrinho e amplia a galeria', async () => {
    stubMatchMedia(false)
    const { user } = await renderAppAt('/nfts/emerald-ape-042')

    expect(await screen.findByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Comprar NFT' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Adicionar ao carrinho' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Adicionar ao carrinho' }))
    expect(await screen.findByText('Emerald Ape #042 foi adicionado ao carrinho.')).toBeVisible()

    const nextImage = screen.queryByRole('button', { name: /Ver imagem 2/ })
    if (nextImage) await user.click(nextImage)
    await user.click(screen.getByRole('button', { name: /Ampliar imagem/ }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('mostra o erro de carga e tenta de novo', async () => {
    setScenario('server-error')
    const { user } = await renderAppAt('/nfts/emerald-ape-042')

    expect(await screen.findByRole('heading', { name: /Não foi possível carregar/ })).toBeVisible()
    setScenario('default')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })

  it('leva o visitante ao login ao favoritar', async () => {
    const { user, router } = await renderAppAt('/nfts/emerald-ape-042')
    await screen.findByRole('heading', { level: 1, name: 'Emerald Ape #042' })

    await user.click(screen.getByRole('button', { name: /favorit/i }))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
  })
})
