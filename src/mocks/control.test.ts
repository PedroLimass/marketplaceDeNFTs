import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockControl } from './control'
import { DB_STORAGE_KEY, getDb, initMockDb, mutateDb } from './db/mockDb'
import { getScenarioId, setScenario, SCENARIO_STORAGE_KEY } from './scenarios/current'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

describe('createMockControl', () => {
  beforeEach(() => {
    setScenario('default')
  })

  it('lista os cenários e informa o atual', () => {
    const control = createMockControl({ storage: memoryStorage(), reload: vi.fn() })

    expect(control.scenarios).toContain('flaky')
    expect(control.getScenario()).toBe('default')
  })

  it('troca o cenário, guarda na sessão e recarrega a página', () => {
    const storage = memoryStorage()
    const reload = vi.fn()

    createMockControl({ storage, reload }).setScenario('flaky')

    expect(getScenarioId()).toBe('flaky')
    expect(storage.getItem(SCENARIO_STORAGE_KEY)).toBe('flaky')
    expect(reload).toHaveBeenCalledOnce()
  })

  it('restaura o banco do mock e recarrega a página', async () => {
    const dbStorage = memoryStorage()
    await initMockDb({ storage: dbStorage })
    mutateDb((db) => {
      db.sessions.length = 0
      db.users.length = 0
    })
    expect(getDb().users).toHaveLength(0)

    const reload = vi.fn()
    await createMockControl({ storage: memoryStorage(), reload }).reset()

    expect(getDb().users.length).toBeGreaterThan(0)
    expect(dbStorage.getItem(DB_STORAGE_KEY)).not.toBeNull()
    expect(reload).toHaveBeenCalledOnce()
  })
})
