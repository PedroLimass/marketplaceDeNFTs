import {
  AxiosError,
  CanceledError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createHttpClient } from './axios'
import { ApiError } from './errors'
import { configureHttp, resetHttpHooks } from './interceptors'

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  return { status, statusText: '', data, headers: {}, config } satisfies AxiosResponse
}

function adapterReturning(status: number, data: unknown): AxiosAdapter {
  return (config) => {
    const response = respond(config, status, data)
    if (status >= 400) {
      return Promise.reject(
        new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response),
      )
    }
    return Promise.resolve(response)
  }
}

function clientWith(adapter: AxiosAdapter) {
  const client = createHttpClient('/api')
  client.defaults.adapter = adapter
  return client
}

afterEach(() => {
  resetHttpHooks()
})

describe('interceptors HTTP', () => {
  it('envia o token de acesso quando existe', async () => {
    const adapter = vi.fn(adapterReturning(200, {}))
    configureHttp({ getAccessToken: () => 'abc123' })

    await clientWith(adapter).get('/nfts')

    const sent = adapter.mock.calls[0]?.[0]
    expect(sent?.headers.get('Authorization')).toBe('Bearer abc123')
  })

  it('não envia Authorization para visitantes', async () => {
    const adapter = vi.fn(adapterReturning(200, {}))

    await clientWith(adapter).get('/nfts')

    const sent = adapter.mock.calls[0]?.[0]
    expect(sent?.headers.has('Authorization')).toBe(false)
  })

  it('rejeita com ApiError tipado', async () => {
    const client = clientWith(adapterReturning(404, null))

    await expect(client.get('/nfts/x')).rejects.toBeInstanceOf(ApiError)
    await expect(client.get('/nfts/x')).rejects.toMatchObject({ kind: 'not_found', status: 404 })
  })

  it('notifica a expiração de sessão apenas para o código session_expired', async () => {
    const onSessionExpired = vi.fn()
    configureHttp({ onSessionExpired })

    const expired = clientWith(
      adapterReturning(401, { error: { code: 'session_expired', message: 'Sessão expirada' } }),
    )
    const badCredentials = clientWith(
      adapterReturning(401, { error: { code: 'invalid_credentials', message: 'Senha incorreta' } }),
    )

    await expect(expired.get('/session')).rejects.toBeInstanceOf(ApiError)
    expect(onSessionExpired).toHaveBeenCalledTimes(1)

    await expect(badCredentials.post('/login')).rejects.toBeInstanceOf(ApiError)
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('repassa cancelamentos sem convertê-los em ApiError', async () => {
    const client = clientWith((config) => Promise.reject(new CanceledError('cancelado', config)))

    await expect(client.get('/nfts')).rejects.toBeInstanceOf(CanceledError)
  })
})
