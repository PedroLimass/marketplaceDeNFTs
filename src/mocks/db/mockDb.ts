import { createSeedState } from './seed'
import { DB_SCHEMA_VERSION, type MockDbState } from './types'

export const DB_STORAGE_KEY = 'kurio.mock-db'

export type DbStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

let state: MockDbState | undefined
let storage: DbStorage | undefined

function isPersistedState(value: unknown): value is MockDbState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<MockDbState>

  return (
    candidate.schemaVersion === DB_SCHEMA_VERSION &&
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.sessions) &&
    Array.isArray(candidate.nfts) &&
    typeof candidate.favorites === 'object' &&
    typeof candidate.carts === 'object' &&
    typeof candidate.wallets === 'object' &&
    typeof candidate.quotes === 'object' &&
    Array.isArray(candidate.orders) &&
    typeof candidate.idempotency === 'object' &&
    typeof candidate.scenarioEffects === 'object'
  )
}

function load(source: DbStorage | undefined): MockDbState | undefined {
  const raw = source?.getItem(DB_STORAGE_KEY)
  if (!raw) return undefined

  try {
    const parsed: unknown = JSON.parse(raw)
    return isPersistedState(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function persist(): void {
  if (!state || !storage) return

  try {
    storage.setItem(DB_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Cota do localStorage excedida: o estado segue válido em memória nesta sessão.
  }
}

/** Carrega o estado persistido ou, na falta dele (ou se estiver inválido), recria o seed. */
export async function initMockDb(options: { storage?: DbStorage } = {}): Promise<void> {
  storage = options.storage
  state = load(storage) ?? (await createSeedState())
  persist()
}

export function getDb(): MockDbState {
  if (!state) throw new Error('O banco do mock não foi inicializado. Chame initMockDb() primeiro.')
  return state
}

/** Único ponto de escrita: aplica a alteração e persiste em seguida. */
export function mutateDb<T>(recipe: (draft: MockDbState) => T): T {
  const result = recipe(getDb())
  persist()
  return result
}

/** Restaura integralmente o cenário conhecido, descartando qualquer alteração. */
export async function resetMockDb(): Promise<void> {
  storage?.removeItem(DB_STORAGE_KEY)
  state = await createSeedState()
  persist()
}
