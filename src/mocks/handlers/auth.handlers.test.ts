import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthResponse, SessionResponse } from '@/features/auth/schemas/auth.schemas'
import { createHttpClient } from '@/infrastructure/http/axios'

import { initMockDb, resetMockDb, type DbStorage } from '../db/mockDb'
import { setScenario } from '../scenarios/current'
import { SESSION_TTL_MS } from '../scenarios/scenarios'
import { authHandlers } from './auth.handlers'

const server = setupServer(...authHandlers)
const client = createHttpClient('http://localhost/api')

const memoryStorage = (): DbStorage => {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

const messages: unknown = expect.arrayContaining([expect.any(String)])

const bearer = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } })

async function login(email = 'nova@kurio.test', password = 'Kurio@2026') {
  const { data } = await client.post<AuthResponse>('/auth/login', { email, password })
  return data
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})
beforeEach(async () => {
  setScenario('default')
  await initMockDb({ storage: memoryStorage() })
  await resetMockDb()
})
afterEach(() => {
  server.resetHandlers()
  vi.useRealTimers()
})
afterAll(() => {
  server.close()
})

describe('POST /auth/login', () => {
  it('autentica com as credenciais das fixtures', async () => {
    const data = await login()

    expect(data.user).toMatchObject({ id: 'usr_nova', email: 'nova@kurio.test' })
    expect(data.access_token).toMatch(/^tok_/)
    expect(new Date(data.expires_at).getTime()).toBeGreaterThan(Date.now())
  })

  it('normaliza o e-mail antes de procurar o usuário', async () => {
    const data = await login('  NOVA@Kurio.test ')

    expect(data.user.id).toBe('usr_nova')
  })

  it('responde invalid_credentials sem revelar qual campo errou', async () => {
    await expect(login('nova@kurio.test', 'senhaErrada1')).rejects.toMatchObject({
      kind: 'unauthorized',
      code: 'invalid_credentials',
    })
    await expect(login('ninguem@kurio.test')).rejects.toMatchObject({
      kind: 'unauthorized',
      code: 'invalid_credentials',
    })
  })

  it('valida o formato do corpo', async () => {
    await expect(client.post('/auth/login', { email: 'x', password: '' })).rejects.toMatchObject({
      kind: 'validation',
      fieldErrors: { email: messages, password: messages },
    })
  })
})

describe('POST /auth/register', () => {
  const novo = { username: 'camila', email: 'camila@kurio.test', password: 'Kurio@2026' }

  it('cria a conta, já autentica e permite entrar depois', async () => {
    const created = await client.post<AuthResponse>('/auth/register', novo)

    expect(created.status).toBe(201)
    expect(created.data.user).toMatchObject({ username: 'camila', display_name: 'camila' })

    const again = await login('camila@kurio.test')
    expect(again.user.id).toBe(created.data.user.id)
  })

  it('valida os campos e devolve erros por campo', async () => {
    await expect(
      client.post('/auth/register', { username: 'a', email: 'ruim', password: '123' }),
    ).rejects.toMatchObject({
      kind: 'validation',
      code: 'validation_failed',
      fieldErrors: { username: messages, email: messages, password: messages },
    })
  })

  it('rejeita e-mail e usuário já existentes com 409', async () => {
    await expect(
      client.post('/auth/register', { ...novo, email: 'nova@kurio.test' }),
    ).rejects.toMatchObject({
      kind: 'conflict',
      code: 'email_taken',
      fieldErrors: { email: messages },
    })
    await expect(
      client.post('/auth/register', { ...novo, username: 'NOVA' }),
    ).rejects.toMatchObject({ kind: 'conflict', code: 'username_taken' })
  })

  it('força conflito no cenário signup-conflict', async () => {
    setScenario('signup-conflict')

    await expect(client.post('/auth/register', novo)).rejects.toMatchObject({
      kind: 'conflict',
      code: 'email_taken',
    })
  })
})

describe('GET /auth/session', () => {
  it('trata quem não enviou token como visitante', async () => {
    const { data } = await client.get<SessionResponse>('/auth/session')

    expect(data).toEqual({ user: null, expires_at: null })
  })

  it('devolve o usuário para um token válido', async () => {
    const { access_token } = await login()
    const { data } = await client.get<SessionResponse>('/auth/session', bearer(access_token))

    expect(data.user?.id).toBe('usr_nova')
  })

  it('responde session_expired para token desconhecido', async () => {
    await expect(client.get('/auth/session', bearer('tok_inexistente'))).rejects.toMatchObject({
      kind: 'unauthorized',
      code: 'session_expired',
    })
  })

  it('responde session_expired quando o token vence', async () => {
    const { access_token } = await login()

    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.now() + SESSION_TTL_MS + 1_000)

    await expect(client.get('/auth/session', bearer(access_token))).rejects.toMatchObject({
      code: 'session_expired',
    })
  })

  it('encurta a sessão no cenário expired-session', async () => {
    setScenario('expired-session')
    const { access_token, expires_at } = await login()

    expect(new Date(expires_at).getTime() - Date.now()).toBeLessThan(20_000)

    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(Date.now() + 16_000)

    await expect(client.get('/auth/session', bearer(access_token))).rejects.toMatchObject({
      code: 'session_expired',
    })
  })
})

describe('POST /auth/logout', () => {
  it('invalida o token e é idempotente', async () => {
    const { access_token } = await login()

    expect((await client.post('/auth/logout', null, bearer(access_token))).status).toBe(204)
    await expect(client.get('/auth/session', bearer(access_token))).rejects.toMatchObject({
      code: 'session_expired',
    })
    expect((await client.post('/auth/logout', null, bearer(access_token))).status).toBe(204)
    expect((await client.post('/auth/logout')).status).toBe(204)
  })

  it('mantém outras sessões do mesmo usuário ativas', async () => {
    const first = await login()
    const second = await login()

    await client.post('/auth/logout', null, bearer(first.access_token))

    const { data } = await client.get<SessionResponse>('/auth/session', bearer(second.access_token))
    expect(data.user?.id).toBe('usr_nova')
  })
})
