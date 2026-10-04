import type { MockScenarioId } from './scenarioIds'
import type { RequestInfo, RequestPlan, ScenarioConfig } from './types'

export const DEFAULT_LATENCY_MS = 120
export const SLOW_LATENCY_MS = 2_500
export const SESSION_TTL_MS = 30 * 60_000
export const SHORT_SESSION_TTL_MS = 15_000
export const ORDER_RESOLVE_AFTER_MS = 2_000
export const ORDER_TIMEOUT_RESPONSE_DELAY_MS = 15_000
export const FLAKY_FAILURES_PER_ROUTE = 2

const PRIVATE_PREFIXES = ['/favorites', '/orders', '/profile', '/wallets']

function after(delayMs: number): RequestPlan {
  return { delayMs }
}

function unavailable(info: RequestInfo): RequestPlan {
  const status = info.method === 'PUT' && info.pathname.startsWith('/favorites') ? 500 : 503
  return {
    delayMs: DEFAULT_LATENCY_MS,
    outcome: {
      type: 'error',
      status,
      code: 'service_unavailable',
      message: 'O serviço está indisponível no momento.',
    },
  }
}

const base: Omit<ScenarioConfig, 'id' | 'description'> = {
  plan: () => after(DEFAULT_LATENCY_MS),
  catalog: { empty: false },
  session: { ttlMs: SESSION_TTL_MS },
  signup: { forceConflict: false },
  coupon: { forceInvalid: false },
  checkout: { priceChange: false, soldOut: false },
  order: { resolution: 'confirmed', resolveAfterMs: ORDER_RESOLVE_AFTER_MS, responseDelayMs: 0 },
  wallet: { connection: 'connected' },
}

function scenario(
  id: MockScenarioId,
  description: string,
  overrides: Partial<Omit<ScenarioConfig, 'id' | 'description'>> = {},
): ScenarioConfig {
  return { ...base, ...overrides, id, description }
}

export const scenarios = {
  default: scenario('default', 'Sucesso em todas as operações.'),
  empty: scenario('empty', 'O catálogo não retorna nenhum NFT.', {
    catalog: { empty: true },
  }),
  'slow-network': scenario('slow-network', 'Latência fixa de 2,5 s em todas as rotas.', {
    plan: () => after(SLOW_LATENCY_MS),
  }),
  'out-of-order': scenario(
    'out-of-order',
    'Em GET /nfts, requisições ímpares demoram mais que as pares.',
    {
      plan: (info) =>
        info.method === 'GET' && info.pathname === '/nfts'
          ? after(info.count % 2 === 1 ? 1_200 : 100)
          : after(DEFAULT_LATENCY_MS),
    },
  ),
  flaky: scenario(
    'flaky',
    'Cada rota falha por rede nas duas primeiras chamadas e depois funciona.',
    {
      plan: (info) =>
        info.count <= FLAKY_FAILURES_PER_ROUTE
          ? { delayMs: DEFAULT_LATENCY_MS, outcome: { type: 'network-error' } }
          : after(DEFAULT_LATENCY_MS),
    },
  ),
  offline: scenario('offline', 'Toda requisição falha como erro de rede.', {
    plan: () => ({ delayMs: DEFAULT_LATENCY_MS, outcome: { type: 'network-error' } }),
  }),
  'server-error': scenario(
    'server-error',
    'Rotas fora de /auth respondem 503 (500 em PUT /favorites).',
    {
      plan: (info) =>
        info.pathname.startsWith('/auth') ? after(DEFAULT_LATENCY_MS) : unavailable(info),
    },
  ),
  timeout: scenario('timeout', 'GET /nfts nunca responde dentro do limite do cliente.', {
    plan: (info) =>
      info.method === 'GET' && info.pathname === '/nfts'
        ? { delayMs: 0, outcome: { type: 'hang' } }
        : after(DEFAULT_LATENCY_MS),
  }),
  'expired-session': scenario('expired-session', 'O token expira 15 s após o login.', {
    session: { ttlMs: SHORT_SESSION_TTL_MS },
  }),
  unauthorized: scenario('unauthorized', 'Rotas privadas respondem 403.', {
    plan: (info) =>
      PRIVATE_PREFIXES.some((prefix) => info.pathname.startsWith(prefix))
        ? {
            delayMs: DEFAULT_LATENCY_MS,
            outcome: {
              type: 'error',
              status: 403,
              code: 'forbidden',
              message: 'Você não tem permissão para realizar esta ação.',
            },
          }
        : after(DEFAULT_LATENCY_MS),
  }),
  'signup-conflict': scenario('signup-conflict', 'Todo cadastro responde 409.', {
    signup: { forceConflict: true },
  }),
  'invalid-coupon': scenario('invalid-coupon', 'Todo cupom é rejeitado como inválido.', {
    coupon: { forceInvalid: true },
  }),
  'checkout-price-change': scenario(
    'checkout-price-change',
    'O preço de um item do carrinho muda ao abrir o checkout.',
    { checkout: { priceChange: true, soldOut: false } },
  ),
  'checkout-sold-out': scenario(
    'checkout-sold-out',
    'A edição de um item do carrinho esgota durante a compra.',
    { checkout: { priceChange: false, soldOut: true } },
  ),
  'order-timeout': scenario(
    'order-timeout',
    'POST /orders cria o pedido, mas a resposta chega depois do timeout do cliente.',
    {
      order: {
        resolution: 'confirmed',
        resolveAfterMs: ORDER_RESOLVE_AFTER_MS,
        responseDelayMs: ORDER_TIMEOUT_RESPONSE_DELAY_MS,
      },
    },
  ),
  'payment-rejected': scenario('payment-rejected', 'O pedido pendente é recusado.', {
    order: { resolution: 'rejected', resolveAfterMs: ORDER_RESOLVE_AFTER_MS, responseDelayMs: 0 },
  }),
  'wallet-refused': scenario('wallet-refused', 'A conexão com a carteira é recusada.', {
    wallet: { connection: 'refused' },
  }),
} satisfies Record<MockScenarioId, ScenarioConfig>
