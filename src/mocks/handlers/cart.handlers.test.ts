import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { AuthResponse } from '@/features/auth/schemas/auth.schemas'
import type {
  CartMergeResponse,
  CartResponse,
  QuoteDto,
} from '@/features/cart/schemas/cart.schemas'
import { createHttpClient } from '@/infrastructure/http/axios'

import { initMockDb, resetMockDb } from '../db/mockDb'
import { setScenario } from '../scenarios/current'
import { authHandlers } from './auth.handlers'
import { cartHandlers } from './cart.handlers'
import { quoteHandlers } from './quotes.handlers'

const server = setupServer(...authHandlers, ...cartHandlers, ...quoteHandlers)
const client = createHttpClient('http://localhost/api')

const guest = (id = 'guest-1') => ({ headers: { 'X-Guest-Id': id } })

async function userAuth(email = 'nova@kurio.test') {
  const { data } = await client.post<AuthResponse>('/auth/login', {
    email,
    password: 'Kurio@2026',
  })
  return { headers: { Authorization: `Bearer ${data.access_token}` } }
}

type Options = ReturnType<typeof guest> | Awaited<ReturnType<typeof userAuth>>

const add = async (options: Options, nftId: string, editionId: string, quantity: number) =>
  (
    await client.post<CartResponse>(
      '/cart/items',
      { nft_id: nftId, edition_id: editionId, quantity },
      options,
    )
  ).data

const cart = async (options: Options) => (await client.get<CartResponse>('/cart', options)).data

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
})
afterAll(() => {
  server.close()
})

describe('/cart', () => {
  it('devolve o carrinho vazio sem identificar o visitante', async () => {
    expect((await client.get<CartResponse>('/cart')).data.items).toEqual([])
  })

  it('adiciona, soma a mesma linha e calcula o total da linha com precisão', async () => {
    const options = guest()
    await add(options, 'emerald-ape-042', '1/50', 1)
    const result = await add(options, 'emerald-ape-042', '1/50', 1)

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      quantity: 2,
      unit_price_eth: '1.19',
      line_total_eth: '2.38',
      max_quantity: 10,
      issues: [],
    })
  })

  it('limita pela disponibilidade da edição e pelo máximo por pedido', async () => {
    const options = guest()

    await expect(add(options, 'emerald-ape-042', '1/1', 2)).rejects.toMatchObject({
      kind: 'conflict',
      code: 'insufficient_availability',
      details: { available: 1, limit: 1 },
    })
    await expect(add(options, 'emerald-ape-042', '1/50', 11)).rejects.toMatchObject({
      code: 'insufficient_availability',
      details: { limit: 10 },
    })
  })

  it('recusa edição esgotada', async () => {
    await expect(add(guest(), 'sage-vessel-512', '1/35', 1)).rejects.toMatchObject({
      code: 'insufficient_availability',
      details: { available: 0 },
    })
  })

  it('responde 404 para NFT ou edição inexistente', async () => {
    await expect(add(guest(), 'nao-existe', '1/1', 1)).rejects.toMatchObject({ kind: 'not_found' })
    await expect(add(guest(), 'emerald-ape-042', '9/9', 1)).rejects.toMatchObject({
      kind: 'not_found',
    })
  })

  it('altera a quantidade, respeita o limite e remove o item', async () => {
    const options = guest()
    const created = await add(options, 'emerald-ape-042', '1/50', 1)
    const itemId = created.items[0]?.id ?? ''

    const updated = await client.patch<CartResponse>(
      `/cart/items/${itemId}`,
      { quantity: 4 },
      options,
    )
    expect(updated.data.items[0]).toMatchObject({ quantity: 4, line_total_eth: '4.76' })

    await expect(
      client.patch(`/cart/items/${itemId}`, { quantity: 11 }, options),
    ).rejects.toMatchObject({ code: 'insufficient_availability' })

    await client.delete(`/cart/items/${itemId}`, options)
    await client.delete(`/cart/items/${itemId}`, options)
    expect((await cart(options)).items).toEqual([])
  })

  it('isola o carrinho de cada visitante e de cada usuário', async () => {
    await add(guest('a'), 'emerald-ape-042', '1/50', 1)

    expect((await cart(guest('b'))).items).toEqual([])
    expect((await cart(await userAuth('nova@kurio.test'))).items).toEqual([])
  })

  it('exige token válido quando o cabeçalho de sessão é enviado', async () => {
    await expect(cart({ headers: { Authorization: 'Bearer tok_invalido' } })).rejects.toMatchObject(
      { code: 'session_expired' },
    )
  })
})

describe('/cart/merge', () => {
  it('une o carrinho do visitante ao do usuário e é idempotente', async () => {
    const visitor = guest('g-merge')
    await add(visitor, 'emerald-ape-042', '1/50', 2)
    const nova = await userAuth()
    await add(nova, 'emerald-ape-042', '1/50', 1)

    const merge = () =>
      client.post<CartMergeResponse>('/cart/merge', null, {
        headers: { ...nova.headers, ...visitor.headers },
      })

    const first = (await merge()).data
    expect(first.items[0]).toMatchObject({ quantity: 3 })
    expect(first.adjusted).toEqual([])

    const second = (await merge()).data
    expect(second.items[0]).toMatchObject({ quantity: 3 })
    expect((await cart(visitor)).items).toEqual([])
  })

  it('limita a soma pela disponibilidade e informa o ajuste', async () => {
    const visitor = guest('g-limit')
    await add(visitor, 'emerald-ape-042', '1/50', 8)
    const nova = await userAuth()
    await add(nova, 'emerald-ape-042', '1/50', 8)

    const { data } = await client.post<CartMergeResponse>('/cart/merge', null, {
      headers: { ...nova.headers, ...visitor.headers },
    })

    expect(data.items[0]).toMatchObject({ quantity: 10 })
    expect(data.adjusted).toEqual([
      { nft_id: 'emerald-ape-042', name: 'Emerald Ape #042', requested: 16, applied: 10 },
    ])
  })

  it('exige sessão', async () => {
    await expect(client.post('/cart/merge', null, guest())).rejects.toMatchObject({
      kind: 'unauthorized',
    })
  })
})

describe('POST /quotes', () => {
  const quote = async (options: Options, body: object = {}) =>
    (await client.post<QuoteDto>('/quotes', body, options)).data

  it('reproduz os números do design: 26.83 + 0.016 = 26.846 ETH', async () => {
    const options = guest('g-figma')
    await add(options, 'emerald-ape-042', '1/50', 2)
    await add(options, 'violet-nomad-314', '1/100', 6)
    await add(options, 'ivory-baron-088', '1/60', 9)

    expect(await quote(options)).toMatchObject({
      subtotal_eth: '26.83',
      discount_eth: '0',
      network_fee_eth: '0.016',
      total_eth: '26.846',
      coupon: null,
      issues: [],
    })
  })

  it('aplica o cupom em aritmética de inteiros', async () => {
    const options = guest('g-coupon')
    await add(options, 'emerald-ape-042', '1/50', 2)

    expect(await quote(options, { coupon_code: 'lancamento10' })).toMatchObject({
      subtotal_eth: '2.38',
      discount_eth: '0.238',
      total_eth: '2.158',
      coupon: { code: 'LANCAMENTO10', label: 'Desconto do lançamento', percent: 10 },
    })
  })

  it('usa a taxa da rede escolhida', async () => {
    const options = guest('g-network')
    await add(options, 'emerald-ape-042', '1/50', 1)

    expect(await quote(options, { network: 'polygon' })).toMatchObject({
      network_fee_eth: '0.001',
      total_eth: '1.191',
    })
  })

  it('rejeita cupom inválido e expirado com erro no campo', async () => {
    await expect(quote(guest(), { coupon_code: 'XPTO' })).rejects.toMatchObject({
      kind: 'validation',
      code: 'coupon_invalid',
      fieldErrors: { coupon_code: expect.any(Array) as unknown },
    })
    await expect(quote(guest(), { coupon_code: 'EXPIRADO' })).rejects.toMatchObject({
      code: 'coupon_expired',
    })
  })

  it('rejeita todo cupom no cenário invalid-coupon', async () => {
    setScenario('invalid-coupon')

    await expect(quote(guest(), { coupon_code: 'LANCAMENTO10' })).rejects.toMatchObject({
      code: 'coupon_invalid',
    })
  })

  it('devolve zeros para um carrinho vazio', async () => {
    expect(await quote(guest('g-empty'))).toMatchObject({
      items: [],
      subtotal_eth: '0',
      network_fee_eth: '0',
      total_eth: '0',
    })
  })
})
