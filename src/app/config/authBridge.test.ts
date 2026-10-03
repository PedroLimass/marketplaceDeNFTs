import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { sessionQueryOptions } from '@/features/auth/api/sessionQuery'
import { TOKEN_STORAGE_KEY } from '@/features/auth/storage/tokenStorage'
import { ApiError } from '@/infrastructure/http/errors'
import { resetHttpHooks, installInterceptors } from '@/infrastructure/http/interceptors'
import axios from 'axios'

import { connectAuthToHttp } from './authBridge'

describe('connectAuthToHttp', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    window.localStorage.clear()
    connectAuthToHttp(queryClient)
  })

  afterEach(() => {
    resetHttpHooks()
  })

  it('envia o token salvo no cabeçalho Authorization', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'tok_123')
    const client = axios.create({
      adapter: (config) =>
        Promise.resolve({
          data: config.headers.get('Authorization'),
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
    })
    installInterceptors(client)

    const { data } = await client.get<string>('/qualquer')

    expect(data).toBe('Bearer tok_123')
  })

  it('encerra a sessão e limpa o cache quando o servidor a expira', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'tok_vencido')
    queryClient.setQueryData(['cart'], { items: 1 })
    const client = axios.create({
      adapter: (config) =>
        Promise.reject(
          Object.assign(new Error('401'), {
            isAxiosError: true,
            config,
            response: {
              status: 401,
              data: { error: { code: 'session_expired', message: 'Sessão expirada.' } },
              headers: {},
              statusText: '',
              config,
            },
          }),
        ),
    })
    installInterceptors(client)

    await expect(client.get('/cart')).rejects.toBeInstanceOf(ApiError)

    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
    expect(queryClient.getQueryData(['cart'])).toBeUndefined()
    expect(queryClient.getQueryData(sessionQueryOptions.queryKey)).toBeNull()
  })
})
