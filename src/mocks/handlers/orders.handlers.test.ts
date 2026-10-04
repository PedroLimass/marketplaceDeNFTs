import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthResponse } from '@/features/auth/schemas/auth.schemas'
import type { CartResponse, QuoteDto } from '@/features/cart/schemas/cart.schemas'
import type { OrderDto } from '@/features/orders/schemas/order.schemas'
import type { WalletsResponse } from '@/features/wallets/schemas/wallet.schemas'
import { createHttpClient } from '@/infrastructure/http/axios'

import { initMockDb, resetMockDb } from '../db/mockDb'
import { setScenario } from '../scenarios/current'
import type { MockScenarioId } from '../scenarios/scenarioIds'
import { authHandlers } from './auth.handlers'
import { cartHandlers } from './cart.handlers'
import { catalogHandlers } from './catalog.handlers'
import { ordersHandlers } from './orders.handlers'
import { quoteHandlers } from './quotes.handlers'
import { walletsHandlers } from './wallets.handlers'

const server = setupServer(
  ...authHandlers,
  ...catalogHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...ordersHandlers,
  ...walletsHandlers,
)
const client = createHttpClient('http://localhost/api')

const collector = { display_name: 'Nova Sato', email: 'nova@kurio.test' }

async function login(email = 'nova@kurio.test') {
  const { data } = await client.post<AuthResponse>('/auth/login', {
    email,
    password: 'Kurio@2026',
  })
  return { headers: { Authorization: `Bearer ${data.access_token}` } }
}

type Options = Awaited<ReturnType<typeof login>>

const addToCart = (options: Options, nftId: string, editionId: string, quantity: number) =>
  client.post<CartResponse>(
    '/cart/items',
    { nft_id: nftId, edition_id: editionId, quantity },
    options,
  )

const cartOf = async (options: Options) => (await client.get<CartResponse>('/cart', options)).data

const quoteOf = async (options: Options, network = 'ethereum') =>
  (await client.post<QuoteDto>('/quotes', { network }, options)).data

const primaryWalletId = async (options: Options) => {
  const { data } = await client.get<WalletsResponse>('/wallets', options)
  const [primary] = data.items
  if (!primary) throw new Error('Sem carteira')
  return primary.id
}

async function bodyFor(options: Options, quote: QuoteDto) {
  return {
    quote_id: quote.id,
    wallet_id: await primaryWalletId(options),
    network: quote.network,
    collector,
  }
}

const create = (options: Options, body: unknown, key = 'key-1') =>
  client.post<OrderDto>('/orders', body, {
    headers: { ...options.headers, 'Idempotency-Key': key },
  })

const fetchOrder = async (options: Options, id: string) =>
  (await client.get<OrderDto>(`/orders/${id}`, options)).data

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})
beforeEach(async () => {
  setScenario('default')
  await initMockDb()
  await resetMockDb()
})
afterEach(() => {
  server.resetHandlers()
  vi.useRealTimers()
})
afterAll(() => {
  server.close()
})

async function readyCart(scenario: MockScenarioId = 'default') {
  setScenario(scenario)
  const options = await login()
  await addToCart(options, 'emerald-ape-042', '1/50', 2)
  const quote = await quoteOf(options)
  return { options, quote, body: await bodyFor(options, quote) }
}

describe('POST /orders', () => {
  it('exige sessão e o cabeçalho Idempotency-Key', async () => {
    await expect(client.post('/orders', {})).rejects.toMatchObject({ code: 'unauthenticated' })

    const { options, body } = await readyCart()
    await expect(client.post('/orders', body, options)).rejects.toMatchObject({
      status: 400,
      code: 'idempotency_key_required',
    })
  })

  it('cria o pedido pendente com o retrato dos itens e dos valores', async () => {
    const { options, quote, body } = await readyCart()

    const response = await create(options, body)

    expect(response.status).toBe(202)
    expect(response.data).toMatchObject({
      status: 'pending',
      version: 1,
      subtotal_eth: quote.subtotal_eth,
      network_fee_eth: '0.016',
      total_eth: quote.total_eth,
      network: 'ethereum',
      wallet: { type: 'metamask', label: 'MetaMask' },
      collector,
      transaction: null,
      rejection: null,
      resolved_at: null,
    })
    expect(response.data.items).toEqual([
      expect.objectContaining({ nft_id: 'emerald-ape-042', quantity: 2, edition_label: '1/50' }),
    ])
  })

  it('devolve o mesmo pedido para a mesma chave e corpo, sem criar outro', async () => {
    const { options, body } = await readyCart()

    const first = await create(options, body)
    const second = await create(options, body)

    expect(second.status).toBe(200)
    expect(second.data.id).toBe(first.data.id)
    const list = await client.get<{ items: OrderDto[] }>('/orders', options)
    expect(list.data.items).toHaveLength(1)
  })

  it('recusa a mesma chave com outro corpo', async () => {
    const { options, body } = await readyCart()
    await create(options, body)

    await expect(create(options, { ...body, note: 'Outra coisa' })).rejects.toMatchObject({
      status: 409,
      code: 'idempotency_key_reused',
    })
  })

  it('valida carteira, rede e cotação', async () => {
    const { options, body } = await readyCart()

    await expect(create(options, { ...body, wallet_id: 'nao-existe' })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { wallet_id: expect.any(Array) as unknown },
    })
    await expect(create(options, { ...body, network: 'polygon' })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { network: expect.any(Array) as unknown },
    })
    await expect(create(options, { ...body, quote_id: 'qte_x' })).rejects.toMatchObject({
      status: 422,
    })
  })

  it('responde quote_stale com a cotação nova quando o carrinho mudou depois da cotação', async () => {
    const { options, quote, body } = await readyCart()
    await addToCart(options, 'emerald-ape-042', '1/50', 1)

    const error = await create(options, body).catch((caught: unknown) => caught)

    expect(error).toMatchObject({ status: 409, code: 'quote_stale' })
    const next = (error as { details: { quote: QuoteDto } }).details.quote
    expect(next.id).not.toBe(quote.id)
    expect(next.items[0]?.quantity).toBe(3)

    const retried = await create(options, { ...body, quote_id: next.id }, 'key-2')
    expect(retried.status).toBe(202)
  })

  it('checkout-price-change: o preço muda e o servidor pede nova conferência', async () => {
    const { options, body, quote } = await readyCart('checkout-price-change')

    const error = await create(options, body).catch((caught: unknown) => caught)

    expect(error).toMatchObject({ status: 409, code: 'quote_stale' })
    const next = (error as { details: { quote: QuoteDto } }).details.quote
    expect(next.subtotal_eth).not.toBe(quote.subtotal_eth)
    expect(next.issues).toEqual([{ nft_id: 'emerald-ape-042', code: 'price_changed' }])
    await expect(create(options, { ...body, quote_id: next.id }, 'key-2')).rejects.toMatchObject({
      code: 'quote_stale',
    })

    const [line] = (await cartOf(options)).items
    await client.patch(`/cart/items/${line?.id ?? ''}`, { accept_price: true }, options)
    const accepted = await quoteOf(options)
    const retried = await create(options, { ...body, quote_id: accepted.id }, 'key-3')
    expect(retried.status).toBe(202)
  })

  it('checkout-sold-out: informa a disponibilidade restante', async () => {
    const { options, body } = await readyCart('checkout-sold-out')

    await expect(create(options, body)).rejects.toMatchObject({
      status: 409,
      code: 'insufficient_availability',
      details: { items: [{ nft_id: 'emerald-ape-042', available: 0 }] },
    })
  })

  it('reserva o estoque ao criar o pedido', async () => {
    const { options, body } = await readyCart()
    const before = await client.get<{ editions: { id: string; available: number }[] }>(
      '/nfts/emerald-ape-042',
    )

    await create(options, body)

    const after = await client.get<{ editions: { id: string; available: number }[] }>(
      '/nfts/emerald-ape-042',
    )
    const stock = (value: typeof before.data) =>
      value.editions.find((edition) => edition.id === '1/50')?.available
    expect((stock(before.data) ?? 0) - (stock(after.data) ?? 0)).toBe(2)
  })
})

describe('resolução do pedido', () => {
  it('confirma depois do prazo, gera a transação e tira do carrinho só o que foi comprado', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const { options, body } = await readyCart()
    await addToCart(options, 'violet-nomad-314', '1/60', 1).catch(() => undefined)
    const created = await create(options, body)

    expect((await fetchOrder(options, created.data.id)).status).toBe('pending')

    vi.advanceTimersByTime(2_500)
    const confirmed = await fetchOrder(options, created.data.id)

    expect(confirmed).toMatchObject({ status: 'confirmed', version: 2 })
    expect(confirmed.transaction?.hash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(confirmed.transaction?.explorer_url).toContain(confirmed.transaction?.hash)
    expect(confirmed.resolved_at).not.toBeNull()
    expect((await cartOf(options)).items.some((item) => item.nft.id === 'emerald-ape-042')).toBe(
      false,
    )
  })

  it('payment-rejected: recusa e devolve o estoque, mantendo o carrinho', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const { options, body } = await readyCart('payment-rejected')
    const created = await create(options, body)

    vi.advanceTimersByTime(2_500)
    const rejected = await fetchOrder(options, created.data.id)

    expect(rejected).toMatchObject({
      status: 'rejected',
      rejection: { code: 'payment_declined' },
      transaction: null,
    })
    expect((await cartOf(options)).items).toHaveLength(1)
    const nft = await client.get<{ editions: { id: string; available: number }[] }>(
      '/nfts/emerald-ape-042',
    )
    expect(nft.data.editions.find((edition) => edition.id === '1/50')?.available).toBe(50)
  })

  it('não altera um pedido que já está em estado final', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const { options, body } = await readyCart()
    const created = await create(options, body)

    vi.advanceTimersByTime(2_500)
    const first = await fetchOrder(options, created.data.id)
    vi.advanceTimersByTime(10_000)
    expect(await fetchOrder(options, created.data.id)).toEqual(first)
  })
})

describe('GET /orders', () => {
  it('lista só os pedidos do usuário, filtrando por status', async () => {
    const { options, body } = await readyCart()
    const created = await create(options, body)
    const other = await login('rafael@kurio.test')

    const pending = await client.get<{ items: OrderDto[] }>('/orders?status=pending', options)
    expect(pending.data.items.map((order) => order.id)).toEqual([created.data.id])
    const confirmed = await client.get<{ items: OrderDto[] }>('/orders?status=confirmed', options)
    expect(confirmed.data.items).toEqual([])
    expect((await client.get<{ items: OrderDto[] }>('/orders', other)).data.items).toEqual([])
    await expect(fetchOrder(other, created.data.id)).rejects.toMatchObject({
      status: 404,
      code: 'order_not_found',
    })
  })
})
