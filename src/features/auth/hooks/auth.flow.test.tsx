import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import type { ReactNode } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { connectAuthToHttp } from '@/app/config/authBridge'
import { authHandlers } from '@/mocks/handlers/auth.handlers'
import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'
import { setScenario } from '@/mocks/scenarios/current'
import { resetHttpHooks } from '@/infrastructure/http/interceptors'

import { TOKEN_STORAGE_KEY } from '../storage/tokenStorage'
import { useLogin, useLogout, useRegister } from './useAuthMutations'
import { useSession } from './useSession'

const server = setupServer(...authHandlers)

let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function renderAuth() {
  return renderHook(
    () => ({
      session: useSession(),
      login: useLogin(),
      register: useRegister(),
      logout: useLogout(),
    }),
    { wrapper },
  )
}

describe('fluxo de autenticação no cliente', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(async () => {
    await initMockDb()
    await resetMockDb()
    setScenario('default')
    window.localStorage.clear()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    connectAuthToHttp(queryClient)
  })

  afterEach(() => {
    server.resetHandlers()
    resetHttpHooks()
  })

  afterAll(() => {
    server.close()
  })

  it('começa como visitante, sem chamar a API', async () => {
    const { result } = renderAuth()

    await waitFor(() => {
      expect(result.current.session.isSuccess).toBe(true)
    })
    expect(result.current.session.data).toBeNull()
  })

  it('entra, persiste o token, e sai limpando tudo', async () => {
    const { result } = renderAuth()
    await waitFor(() => {
      expect(result.current.session.isSuccess).toBe(true)
    })

    await act(async () => {
      await result.current.login.mutateAsync({ email: 'nova@kurio.test', password: 'Kurio@2026' })
    })

    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toMatch(/\S/)
    await waitFor(() => {
      expect(result.current.session.data?.user.username).toBe('nova')
    })

    await act(async () => {
      await result.current.logout.mutateAsync()
    })

    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
    await waitFor(() => {
      expect(result.current.session.data).toBeNull()
    })
  })

  it('cadastra e já entra autenticado', async () => {
    const { result } = renderAuth()

    await act(async () => {
      await result.current.register.mutateAsync({
        username: 'camila',
        email: 'camila@kurio.test',
        password: 'Kurio@2026',
      })
    })

    await waitFor(() => {
      expect(result.current.session.data?.user.email).toBe('camila@kurio.test')
    })
  })

  it('descarta um token desconhecido e volta a visitante', async () => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, 'tok_inexistente')

    const { result } = renderAuth()

    await waitFor(() => {
      expect(result.current.session.isSuccess).toBe(true)
    })
    expect(result.current.session.data).toBeNull()
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })
})
