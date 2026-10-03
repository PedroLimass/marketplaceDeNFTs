import { isMockScenarioId, type MockScenarioId } from './scenarioIds'
import { scenarios } from './scenarios'
import type { ScenarioConfig } from './types'

export const SCENARIO_QUERY_PARAM = 'scenario'
export const SCENARIO_STORAGE_KEY = 'kurio.mock-scenario'

const counters = new Map<string, number>()
let currentId: MockScenarioId = 'default'

export function getScenarioId(): MockScenarioId {
  return currentId
}

export function getScenario(): ScenarioConfig {
  return scenarios[currentId]
}

export function setScenario(id: MockScenarioId): void {
  currentId = id
  counters.clear()
}

/** Conta as requisições por método + rota, para cenários como `flaky` e `out-of-order`. */
export function nextRequestCount(method: string, pathname: string): number {
  const key = `${method} ${pathname}`
  const count = (counters.get(key) ?? 0) + 1
  counters.set(key, count)
  return count
}

export interface ResolveScenarioInput {
  search: string
  storage: Pick<Storage, 'getItem'> | undefined
  fallback: MockScenarioId
}

/**
 * Precedência: `?scenario=` na URL, depois o valor guardado na sessão do navegador
 * e, por fim, a variável de ambiente. Valores desconhecidos são ignorados.
 */
export function resolveInitialScenario({
  search,
  storage,
  fallback,
}: ResolveScenarioInput): MockScenarioId {
  const fromUrl = new URLSearchParams(search).get(SCENARIO_QUERY_PARAM)
  if (isMockScenarioId(fromUrl)) return fromUrl

  const fromStorage = storage?.getItem(SCENARIO_STORAGE_KEY)
  if (isMockScenarioId(fromStorage)) return fromStorage

  return fallback
}
