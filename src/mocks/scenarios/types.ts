import type { MockScenarioId } from './scenarioIds'

export interface RequestInfo {
  method: string
  pathname: string
  count: number
}

export type Outcome =
  | { type: 'network-error' }
  | { type: 'hang' }
  | { type: 'error'; status: number; code: string; message: string }

export interface RequestPlan {
  delayMs: number
  outcome?: Outcome
}

export interface ScenarioConfig {
  id: MockScenarioId
  description: string
  plan: (info: RequestInfo) => RequestPlan
  catalog: { empty: boolean }
  session: { ttlMs: number }
  signup: { forceConflict: boolean }
  coupon: { forceInvalid: boolean }
  checkout: { priceChange: boolean; soldOut: boolean }
  order: {
    resolution: 'confirmed' | 'rejected'
    resolveAfterMs: number
    responseDelayMs: number
  }
  wallet: { connection: 'connected' | 'refused' }
}
