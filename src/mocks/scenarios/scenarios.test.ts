import { describe, expect, it } from 'vitest'

import { mockScenarioIds } from './scenarioIds'
import {
  DEFAULT_LATENCY_MS,
  FLAKY_FAILURES_PER_ROUTE,
  ORDER_TIMEOUT_RESPONSE_DELAY_MS,
  scenarios,
  SLOW_LATENCY_MS,
} from './scenarios'
import type { RequestInfo } from './types'

function request(method: string, pathname: string, count = 1): RequestInfo {
  return { method, pathname, count }
}

describe('scenarios', () => {
  it('define uma configuração para cada id', () => {
    for (const id of mockScenarioIds) {
      expect(scenarios[id].id).toBe(id)
      expect(scenarios[id].description).not.toBe('')
    }
  })

  it('default apenas aplica a latência padrão', () => {
    expect(scenarios.default.plan(request('GET', '/nfts'))).toEqual({ delayMs: DEFAULT_LATENCY_MS })
  })

  it('slow-network aplica latência alta em qualquer rota', () => {
    expect(scenarios['slow-network'].plan(request('POST', '/orders')).delayMs).toBe(SLOW_LATENCY_MS)
  })

  it('out-of-order atrasa as chamadas ímpares de GET /nfts', () => {
    const plan = scenarios['out-of-order'].plan
    const delays = [1, 2, 3, 4].map((count) => plan(request('GET', '/nfts', count)).delayMs)

    expect(delays).toEqual([1_200, 100, 1_200, 100])
    expect(plan(request('GET', '/cart', 1)).delayMs).toBe(DEFAULT_LATENCY_MS)
  })

  it('flaky falha nas primeiras chamadas de cada rota e depois recupera', () => {
    const plan = scenarios.flaky.plan

    for (let count = 1; count <= FLAKY_FAILURES_PER_ROUTE; count += 1) {
      expect(plan(request('GET', '/nfts', count)).outcome).toEqual({ type: 'network-error' })
    }
    expect(plan(request('GET', '/nfts', FLAKY_FAILURES_PER_ROUTE + 1)).outcome).toBeUndefined()
  })

  it('offline sempre falha por rede', () => {
    expect(scenarios.offline.plan(request('GET', '/nfts', 99)).outcome).toEqual({
      type: 'network-error',
    })
  })

  it('server-error preserva /auth e usa 500 em PUT /favorites', () => {
    const plan = scenarios['server-error'].plan

    expect(plan(request('POST', '/auth/login')).outcome).toBeUndefined()
    expect(plan(request('GET', '/nfts')).outcome).toMatchObject({ status: 503 })
    expect(plan(request('PUT', '/favorites/emerald-ape-042')).outcome).toMatchObject({
      status: 500,
    })
  })

  it('timeout trava apenas GET /nfts', () => {
    const plan = scenarios.timeout.plan

    expect(plan(request('GET', '/nfts')).outcome).toEqual({ type: 'hang' })
    expect(plan(request('GET', '/nfts/emerald-ape-042')).outcome).toBeUndefined()
  })

  it('unauthorized bloqueia somente rotas privadas', () => {
    const plan = scenarios.unauthorized.plan

    expect(plan(request('GET', '/profile')).outcome).toMatchObject({ status: 403 })
    expect(plan(request('GET', '/wallets')).outcome).toMatchObject({ status: 403 })
    expect(plan(request('GET', '/nfts')).outcome).toBeUndefined()
  })

  it('carrega os parâmetros de domínio de cada cenário', () => {
    expect(scenarios.empty.catalog.empty).toBe(true)
    expect(scenarios['expired-session'].session.ttlMs).toBeLessThan(scenarios.default.session.ttlMs)
    expect(scenarios['signup-conflict'].signup.forceConflict).toBe(true)
    expect(scenarios['invalid-coupon'].coupon.forceInvalid).toBe(true)
    expect(scenarios['checkout-price-change'].checkout.priceChange).toBe(true)
    expect(scenarios['checkout-sold-out'].checkout.soldOut).toBe(true)
    expect(scenarios['payment-rejected'].order.resolution).toBe('rejected')
    expect(scenarios['order-timeout'].order.responseDelayMs).toBe(ORDER_TIMEOUT_RESPONSE_DELAY_MS)
    expect(scenarios['wallet-refused'].wallet.connection).toBe('refused')
  })
})
