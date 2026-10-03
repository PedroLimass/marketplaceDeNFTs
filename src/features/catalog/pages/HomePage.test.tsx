import { screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resetHttpHooks } from '@/infrastructure/http/interceptors'
import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'
import { authHandlers } from '@/mocks/handlers/auth.handlers'
import { catalogHandlers } from '@/mocks/handlers/catalog.handlers'
import { scenarioHandler } from '@/mocks/handlers/scenario.handler'
import { setScenario } from '@/mocks/scenarios/current'
import { renderAppAt } from '@/test/renderApp'

const server = setupServer(scenarioHandler, ...authHandlers, ...catalogHandlers)

const cards = () =>
  within(screen.getByRole('region', { name: 'Catálogo de NFTs' })).getAllByRole('article')

describe('Início', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(async () => {
    await initMockDb()
    await resetMockDb()
    setScenario('default')
    window.localStorage.clear()
  })

  afterEach(() => {
    server.resetHandlers()
    resetHttpHooks()
  })

  afterAll(() => {
    server.close()
  })

  it('mostra o carregamento e depois a primeira página do catálogo', async () => {
    await renderAppAt('/')

    expect(screen.getByText('Carregando NFTs…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Emerald Ape #042' })).toBeInTheDocument()
    expect(cards()).toHaveLength(9)
    expect(screen.getByText('36 NFTs encontrados. Página 1 de 4.')).toBeInTheDocument()
  })

  it('mostra os destaques, o Diário da Cunhagem e o rodapé abaixo do catálogo', async () => {
    await renderAppAt('/')
    await screen.findByRole('heading', { name: 'Emerald Ape #042' })

    expect(screen.getByRole('region', { name: 'Destaques' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Diário da Cunhagem' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^Explorar/ }).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('contentinfo')).toHaveTextContent('© 2026 Kurio')
  })

  it('filtra o catálogo pela coleção escolhida no rodapé', async () => {
    const { user, router } = await renderAppAt('/')
    await screen.findByRole('heading', { name: 'Emerald Ape #042' })

    const footer = within(screen.getByRole('contentinfo'))
    await user.click(footer.getByRole('link', { name: 'Fotografia' }))

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ category: 'fotografia' })
    })
  })

  it('exibe o preço anterior riscado quando o NFT teve desconto', async () => {
    await renderAppAt('/')

    const card = (await screen.findByRole('heading', { name: 'Neon Vessel #552' })).closest(
      'article',
    )
    expect(card).not.toBeNull()
    if (card) expect(within(card).getByText(/2,29 ETH|2\.29 ETH/)).toBeInTheDocument()
  })

  it('lê os filtros da URL ao abrir a página', async () => {
    const { router } = await renderAppAt('/?listing=trending&sort=price-asc')

    expect(await screen.findByRole('tab', { name: 'Em alta', selected: true })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/NFTs encontrados/)).toBeInTheDocument()
    })
    expect(router.state.location.search).toMatchObject({ listing: 'trending', sort: 'price-asc' })
  })

  it('troca de aba, grava na URL e volta à primeira página', async () => {
    const { user, router } = await renderAppAt('/?page=2')
    await screen.findByText(/Página 2 de/)

    await user.click(screen.getByRole('tab', { name: 'Novos lançamentos' }))

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ listing: 'new' })
    })
    expect(router.state.location.search).not.toHaveProperty('page')
  })

  it('filtra por categoria e mostra só os itens dela', async () => {
    const { user, router } = await renderAppAt('/')
    await screen.findByRole('heading', { name: 'Emerald Ape #042' })

    await user.click(await screen.findByRole('button', { name: /^Música/ }))

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({ category: 'musica' })
    })
    await waitFor(() => {
      expect(screen.getByText(/^6 NFTs encontrados/)).toBeInTheDocument()
    })
    expect(cards()).toHaveLength(6)
  })

  it('navega entre páginas pelos links de paginação', async () => {
    const { user, router } = await renderAppAt('/')
    await screen.findByRole('heading', { name: 'Emerald Ape #042' })

    await user.click(screen.getByRole('link', { name: 'Página 2' }))

    await waitFor(() => {
      expect(screen.getByText(/Página 2 de 4/)).toBeInTheDocument()
    })
    expect(router.state.location.search).toMatchObject({ page: '2' })
    expect(screen.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('busca por texto pelo campo e mostra o vazio com opção de limpar', async () => {
    const { user, router } = await renderAppAt('/')
    await screen.findByRole('heading', { name: 'Emerald Ape #042' })

    const [field] = screen.getAllByRole('searchbox', { name: 'Buscar NFTs' })
    if (!field) throw new Error('campo de busca ausente')
    await user.type(field, 'zzzz-inexistente')

    expect(await screen.findByText('Nenhum NFT encontrado')).toBeInTheDocument()
    expect(router.state.location.search).toMatchObject({ q: 'zzzz-inexistente' })

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(await screen.findByRole('heading', { name: 'Emerald Ape #042' })).toBeInTheDocument()
    expect(router.state.location.search).not.toHaveProperty('q')
  })

  it('mostra o estado vazio quando o catálogo não tem itens', async () => {
    setScenario('empty')
    await renderAppAt('/')

    expect(await screen.findByText('Nenhum NFT encontrado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument()
  })

  it('mostra o erro e se recupera ao tentar novamente', async () => {
    setScenario('server-error')
    const { user } = await renderAppAt('/')

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByRole('heading')).toHaveTextContent('Não foi possível carregar')

    setScenario('default')
    await user.click(within(alert).getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('heading', { name: 'Emerald Ape #042' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
