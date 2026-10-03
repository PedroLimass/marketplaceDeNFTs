import { beforeEach, describe, expect, it, vi } from 'vitest'

import { userFixtures } from '../fixtures/users'
import { verifyPassword } from '../lib/password'
import { DB_STORAGE_KEY, getDb, initMockDb, mutateDb, resetMockDb, type DbStorage } from './mockDb'

function memoryStorage(initial: Record<string, string> = {}): DbStorage & {
  data: Map<string, string>
} {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

let storage: ReturnType<typeof memoryStorage>

beforeEach(() => {
  storage = memoryStorage()
})

describe('mockDb', () => {
  it('cria o seed com os usuários das fixtures', async () => {
    await initMockDb({ storage })

    expect(getDb().users.map((user) => user.email)).toEqual(userFixtures.map((user) => user.email))
    expect(getDb().sessions).toEqual([])
  })

  it('guarda apenas hashes e valida a senha original', async () => {
    await initMockDb({ storage })

    const serialized = storage.data.get(DB_STORAGE_KEY) ?? ''
    for (const fixture of userFixtures) {
      expect(serialized).not.toContain(fixture.password)
    }

    const nova = getDb().users.find((user) => user.id === 'usr_nova')
    expect(nova).toBeDefined()
    expect(
      await verifyPassword('Kurio@2026', nova?.passwordSalt ?? '', nova?.passwordHash ?? ''),
    ).toBe(true)
    expect(await verifyPassword('errada', nova?.passwordSalt ?? '', nova?.passwordHash ?? '')).toBe(
      false,
    )
  })

  it('gera o mesmo seed em execuções diferentes', async () => {
    await initMockDb({ storage })
    const first = JSON.stringify(getDb())

    await resetMockDb()

    expect(JSON.stringify(getDb())).toBe(first)
  })

  it('persiste as alterações e as recupera após um novo carregamento', async () => {
    await initMockDb({ storage })
    mutateDb((db) => {
      db.sessions.push({ token: 'tok_1', userId: 'usr_nova', expiresAt: 123 })
    })

    await initMockDb({ storage })

    expect(getDb().sessions).toEqual([{ token: 'tok_1', userId: 'usr_nova', expiresAt: 123 }])
  })

  it('o reset descarta as alterações e restaura o seed', async () => {
    await initMockDb({ storage })
    mutateDb((db) => {
      db.users.pop()
      db.sessions.push({ token: 'tok_1', userId: 'usr_nova', expiresAt: 123 })
    })

    await resetMockDb()

    expect(getDb().users).toHaveLength(userFixtures.length)
    expect(getDb().sessions).toEqual([])
  })

  it('ignora dados persistidos inválidos ou de outra versão', async () => {
    for (const raw of ['não é json', '{"schemaVersion":999,"users":[],"sessions":[]}', '{}']) {
      storage = memoryStorage({ [DB_STORAGE_KEY]: raw })

      await initMockDb({ storage })

      expect(getDb().users).toHaveLength(userFixtures.length)
    }
  })

  it('falha com mensagem clara se usado antes da inicialização', async () => {
    vi.resetModules()
    const fresh = await import('./mockDb')

    expect(() => fresh.getDb()).toThrow(/initMockDb/)
  })
})
