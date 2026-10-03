import type { MockScenarioId } from './scenarioIds'

export interface RequestInfo {
  method: string
  /** Caminho relativo ao prefixo da API (ex.: `/nfts`). */
  pathname: string
  /** Ordem desta requisição (1, 2, ...) para o par método + rota. */
  count: number
}

export type Outcome =
  | { type: 'network-error' }
  | { type: 'hang' }
  | { type: 'error'; status: number; code: string; message: string }

export interface RequestPlan {
  delayMs: number
  /** Quando ausente, a requisição segue para o handler de domínio. */
  outcome?: Outcome
}

export interface ScenarioConfig {
  id: MockScenarioId
  description: string
  /** Decide atraso e falha de qualquer requisição antes dos handlers de domínio. */
  plan: (info: RequestInfo) => RequestPlan
  catalog: { empty: boolean }
  session: { ttlMs: number }
  signup: { forceConflict: boolean }
  coupon: { forceInvalid: boolean }
  checkout: { priceChange: boolean; soldOut: boolean }
  order: {
    resolution: 'confirmed' | 'rejected'
    resolveAfterMs: number
    /** Atraso da resposta de POST /orders, usado para simular timeout do cliente. */
    responseDelayMs: number
  }
  wallet: { connection: 'connected' | 'refused' }
}
