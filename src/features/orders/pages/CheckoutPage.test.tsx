import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { couponStore } from '@/features/cart/coupon/couponStore'
import { resetGuestIdCache } from '@/infrastructure/http/guestId'
import { resetHttpHooks } from '@/infrastructure/http/interceptors'
import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'
import { handlers } from '@/mocks/handlers'
import { apiPath } from '@/mocks/lib/apiPath'
import { setScenario } from '@/mocks/scenarios/current'
import type { MockScenarioId } from '@/mocks/scenarios/scenarioIds'
import { toast } from '@/shared/lib/toast'
import { renderAppAt } from '@/test/renderApp'

import { CHECKOUT_ATTEMPT_KEY } from '../storage/checkoutAttempt'

const server = setupServer(...handlers)

type App = Awaited<ReturnType<typeof renderAppAt>>

/** Entra, coloca o Emerald Ape no carrinho e abre o pagamento. */
async function openCheckout(scenario: MockScenarioId = 'default'): Promise<App> {
  setScenario(scenario)
  const app = await renderAppAt('/login?redirect=%2Fnfts%2Femerald-ape-042')
  await app.user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
  await app.user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
  await app.user.click(screen.getByRole('button', { name: 'Entrar' }))

  await screen.findByRole('heading', { level: 1, name: 'Emerald Ape #042' })
  await app.user.click(screen.getByRole('button', { name: 'Comprar' }))
  await screen.findByRole('table', { name: 'NFTs no carrinho' })

  const summary = await screen.findByRole('complementary', { name: 'Resumo da carteira' })
  await waitFor(() => {
    expect(within(summary).getByRole('link', { name: 'Conectar e finalizar' })).toBeInTheDocument()
  })
  await app.user.click(within(summary).getByRole('link', { name: 'Conectar e finalizar' }))
  await screen.findByRole('heading', { level: 1, name: 'Pagamento' })
  return app
}

async function confirmPurchase(app: App) {
  const button = await screen.findByRole('button', { name: 'Confirmar compra' })
  await waitFor(() => {
    expect(button).toBeEnabled()
  })
  await app.user.click(button)
}

describe('Pagamento e confirmação', { timeout: 20_000 }, () => {
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

  it('exige login e volta ao pagamento depois de entrar', async () => {
    const { router } = await renderAppAt('/checkout')

    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toMatchObject({ redirect: '/checkout' })
  })

  it('pré-preenche os dados do colecionador e a carteira principal', async () => {
    await openCheckout()

    expect(await screen.findByLabelText(/Nome de exibição/)).toHaveValue('Nova Alves')
    const main = within(screen.getByRole('main'))
    expect(main.getByLabelText(/E-mail/)).toHaveValue('nova@kurio.test')
    expect(screen.getByRole('radio', { name: /MetaMask/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /WalletConnect/ })).not.toBeChecked()
    expect(screen.getByText('(x 1) · Edição 1/50')).toBeInTheDocument()
  })

  it('troca a rede e a taxa ao escolher a carteira da Polygon', async () => {
    const app = await openCheckout()
    const summary = await screen.findByRole('complementary', { name: 'Resumo da compra' })
    await waitFor(() => {
      expect(within(summary).getByText('0.016 ETH')).toBeInTheDocument()
    })

    await app.user.click(screen.getByRole('radio', { name: /WalletConnect/ }))

    await waitFor(() => {
      expect(within(summary).getByText('0.001 ETH')).toBeInTheDocument()
    })
  })

  it('confirma a compra, acompanha o pedido pendente e mostra o recibo', async () => {
    const app = await openCheckout()
    await confirmPurchase(app)

    expect(
      await screen.findByRole('heading', { name: 'Aguardando a confirmação na rede' }),
    ).toBeVisible()
    expect(window.sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY)).not.toBeNull()

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Seus NFTs agora estão na sua carteira' },
        { timeout: 8_000 },
      ),
    ).toBeVisible()
    expect(screen.getByText('ID do token: #0042')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:\/\/etherscan\.io\/tx\/0x[0-9a-f]{64}$/),
    )
    expect(window.sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY)).toBeNull()

    await app.user.click(screen.getByRole('link', { name: 'Fechar recibo e voltar ao início' }))
    await app.user.click(await screen.findByRole('link', { name: /Carrinho/ }))
    expect(await screen.findByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })

  it('retoma o pedido em andamento ao voltar para o pagamento', async () => {
    const app = await openCheckout()
    await confirmPurchase(app)
    await screen.findByRole('heading', { name: 'Aguardando a confirmação na rede' })

    await app.router.navigate({ to: '/checkout' })

    expect(
      await screen.findByRole('heading', { name: 'Aguardando a confirmação na rede' }),
    ).toBeVisible()
    expect(app.router.state.location.pathname).toMatch(/^\/orders\/ord_/)
  })

  it('payment-rejected: explica a recusa e mantém o carrinho', async () => {
    const app = await openCheckout('payment-rejected')
    await confirmPurchase(app)

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Não foi possível concluir a compra' },
        { timeout: 8_000 },
      ),
    ).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Seus NFTs continuam no carrinho')
    expect(window.sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY)).toBeNull()

    await app.user.click(screen.getByRole('link', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Pagamento' })).toBeVisible()
    expect(screen.getByText('(x 1) · Edição 1/50')).toBeInTheDocument()
  })

  it('reenvia a mesma Idempotency-Key depois de uma falha de comunicação', async () => {
    const keys: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.method === 'POST' && new URL(request.url).pathname.endsWith('/orders')) {
        keys.push(request.headers.get('Idempotency-Key') ?? '')
      }
    })
    server.use(http.post(apiPath('/orders'), () => HttpResponse.error(), { once: true }))

    const app = await openCheckout()
    await confirmPurchase(app)

    expect(await screen.findByText('Não recebemos a resposta do servidor')).toBeVisible()
    await confirmPurchase(app)
    await screen.findByRole('heading', { name: 'Aguardando a confirmação na rede' })

    expect(keys).toHaveLength(2)
    expect(keys[0]).not.toBe('')
    expect(keys[1]).toBe(keys[0])
    server.events.removeAllListeners()
  })

  it('wallet-refused: avisa que a carteira recusou e não cria pedido', async () => {
    const app = await openCheckout('wallet-refused')
    await confirmPurchase(app)

    expect(await screen.findByText('A carteira recusou a conexão')).toBeVisible()
    expect(app.router.state.location.pathname).toBe('/checkout')
  })

  it('checkout-price-change: pede para conferir os novos valores antes de comprar', async () => {
    const app = await openCheckout('checkout-price-change')
    await confirmPurchase(app)

    expect(await screen.findByText('Os valores mudaram desde a última conferência')).toBeVisible()
    await app.user.click(screen.getByRole('button', { name: 'Ver novos valores' }))
    await app.user.click(await screen.findByRole('button', { name: 'Aceitar novo preço' }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Aceitar novo preço' })).not.toBeInTheDocument()
    })

    await confirmPurchase(app)
    expect(
      await screen.findByRole('heading', { name: 'Aguardando a confirmação na rede' }),
    ).toBeVisible()
  })
})
