import { screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resetHttpHooks } from '@/infrastructure/http/interceptors'
import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'
import { handlers } from '@/mocks/handlers'
import { setScenario } from '@/mocks/scenarios/current'
import { stubMatchMedia } from '@/test/matchMedia'
import { renderAppAt } from '@/test/renderApp'

const server = setupServer(...handlers)

describe('MobileTabBar', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(async () => {
    stubMatchMedia(false)
    await initMockDb()
    await resetMockDb()
    setScenario('default')
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    server.resetHandlers()
    resetHttpHooks()
  })

  afterAll(() => {
    server.close()
  })

  it('mostra Início, Carrinho e Entrar no mobile e foca a busca na Home', async () => {
    const { user } = await renderAppAt('/')
    await screen.findByRole('heading', { name: 'Emerald Ape #042' })

    const bar = screen.getByRole('navigation', { name: 'Navegação inferior' })
    expect(bar).toBeVisible()
    expect(within(bar).getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/')
    expect(within(bar).getByRole('link', { name: 'Carrinho' })).toHaveAttribute('href', '/cart')
    expect(within(bar).getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')

    await user.click(within(bar).getByRole('button', { name: 'Buscar NFTs' }))
    await waitFor(() => {
      expect(document.querySelector('main input[type="search"]')).toHaveFocus()
    })
  })

  it('leva à Home e depois foca a busca quando o usuário está em outra rota', async () => {
    const { user, router } = await renderAppAt('/cart')
    await screen.findByRole('heading', { name: 'Seu carrinho está vazio' })

    const bar = screen.getByRole('navigation', { name: 'Navegação inferior' })
    await user.click(within(bar).getByRole('button', { name: 'Buscar NFTs' }))
    await router.load()
    expect(router.state.location.pathname).toBe('/')
  })

  it('mostra Perfil depois do login e o badge do carrinho', async () => {
    const { user } = await renderAppAt('/login')
    await user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
    await user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    await screen.findByRole('heading', { name: 'Emerald Ape #042' })

    expect(screen.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/profile')
  })
})
