import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createHttpClient } from '@/infrastructure/http/axios'

import { apiPath } from '../lib/apiPath'
import { setScenario } from '../scenarios/current'
import { scenarioHandler } from './scenario.handler'

const server = setupServer(
  scenarioHandler,
  http.get(apiPath('/ping'), () => HttpResponse.json({ ok: true })),
  http.get(apiPath('/profile'), () => HttpResponse.json({ ok: true })),
)
const client = createHttpClient('http://localhost/api')

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => {
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})
beforeEach(() => {
  setScenario('default')
})

describe('scenarioHandler', () => {
  it('deixa a requisição seguir para o handler de domínio quando não há falha', async () => {
    const response = await client.get<{ ok: boolean }>('/ping')

    expect(response.data).toEqual({ ok: true })
  })

  it('transforma o cenário offline em erro de rede', async () => {
    setScenario('offline')

    await expect(client.get('/ping')).rejects.toMatchObject({ kind: 'network' })
  })

  it('responde com o erro HTTP definido pelo cenário', async () => {
    setScenario('server-error')

    await expect(client.get('/ping')).rejects.toMatchObject({
      kind: 'transient',
      status: 503,
      code: 'service_unavailable',
    })
  })

  it('bloqueia rotas privadas no cenário unauthorized e libera as públicas', async () => {
    setScenario('unauthorized')

    await expect(client.get('/profile')).rejects.toMatchObject({ kind: 'forbidden', status: 403 })
    await expect(client.get('/ping')).resolves.toMatchObject({ status: 200 })
  })

  it('falha as duas primeiras chamadas no cenário flaky e depois recupera', async () => {
    setScenario('flaky')

    await expect(client.get('/ping')).rejects.toMatchObject({ kind: 'network' })
    await expect(client.get('/ping')).rejects.toMatchObject({ kind: 'network' })
    await expect(client.get('/ping')).resolves.toMatchObject({ status: 200 })
  })
})
