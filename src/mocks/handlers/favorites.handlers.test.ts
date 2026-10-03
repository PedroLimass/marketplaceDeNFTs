import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { AuthResponse } from '@/features/auth/schemas/auth.schemas'
import { createHttpClient } from '@/infrastructure/http/axios'

import { initMockDb, resetMockDb } from '../db/mockDb'
import { setScenario } from '../scenarios/current'
import { authHandlers } from './auth.handlers'
import { catalogHandlers } from './catalog.handlers'
import { favoritesHandlers } from './favorites.handlers'

const server = setupServer(...authHandlers, ...catalogHandlers, ...favoritesHandlers)
const client = createHttpClient('http://localhost/api')

async function tokenFor(email: string) {
  const { data } = await client.post<AuthResponse>('/auth/login', {
    email,
    password: 'Kurio@2026',
  })
  return { headers: { Authorization: `Bearer ${data.access_token}` } }
}

const ids = async (auth: Awaited<ReturnType<typeof tokenFor>>) =>
  (await client.get<{ nft_ids: string[] }>('/favorites', auth)).data.nft_ids

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

describe('/favorites', () => {
  it('exige sessão', async () => {
    await expect(client.get('/favorites')).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('inclui e remove de forma idempotente', async () => {
    const nova = await tokenFor('nova@kurio.test')

    await client.put('/favorites/emerald-ape-042', null, nova)
    await client.put('/favorites/emerald-ape-042', null, nova)
    expect(await ids(nova)).toEqual(['emerald-ape-042'])

    await client.delete('/favorites/emerald-ape-042', nova)
    await client.delete('/favorites/emerald-ape-042', nova)
    expect(await ids(nova)).toEqual([])
  })

  it('isola os favoritos entre usuários', async () => {
    const nova = await tokenFor('nova@kurio.test')
    const rafael = await tokenFor('rafael@kurio.test')

    await client.put('/favorites/emerald-ape-042', null, nova)

    expect(await ids(nova)).toEqual(['emerald-ape-042'])
    expect(await ids(rafael)).toEqual([])
  })

  it('responde 404 ao favoritar um NFT inexistente', async () => {
    const nova = await tokenFor('nova@kurio.test')

    await expect(client.put('/favorites/nao-existe', null, nova)).rejects.toMatchObject({
      kind: 'not_found',
      code: 'nft_not_found',
    })
  })
})
