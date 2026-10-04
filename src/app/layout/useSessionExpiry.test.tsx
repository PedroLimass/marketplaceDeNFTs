import { screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resetHttpHooks } from '@/infrastructure/http/interceptors'
import { initMockDb, mutateDb, resetMockDb } from '@/mocks/db/mockDb'
import { handlers } from '@/mocks/handlers'
import { setScenario } from '@/mocks/scenarios/current'
import { toast } from '@/shared/lib/toast'
import { renderAppAt } from '@/test/renderApp'

import { SESSION_EXPIRED_MESSAGE } from './useSessionExpiry'

const server = setupServer(...handlers)

async function signIn(path: string) {
  const app = await renderAppAt(`/login?redirect=${encodeURIComponent(path)}`)
  await app.user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
  await app.user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
  await app.user.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  await within(screen.getByRole('banner')).findByRole('button', { name: 'Sair' })
  return app
}

function expireServerSessions() {
  mutateDb((db) => {
    db.sessions.forEach((session) => {
      session.expiresAt = 0
    })
  })
}

describe('sessão expirada durante a navegação', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(async () => {
    await initMockDb()
    await resetMockDb()
    setScenario('default')
    window.localStorage.clear()
    window.sessionStorage.clear()
    toast.clear()
  })

  afterEach(() => {
    server.resetHandlers()
    resetHttpHooks()
  })

  afterAll(() => {
    server.close()
  })

  it('leva ao login e guarda o destino quando a sessão expira numa tela privada', async () => {
    const { router, queryClient } = await signIn('/profile')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/profile')
    })

    expireServerSessions()
    await queryClient.invalidateQueries()

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
    expect(router.state.location.search).toEqual({ redirect: '/profile' })
    expect(await screen.findByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument()
  })

  it('em tela pública só avisa e mantém o visitante onde está', async () => {
    const { router, queryClient } = await signIn('/cart')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/cart')
    })

    expireServerSessions()
    await queryClient.invalidateQueries()

    expect(await screen.findByText(SESSION_EXPIRED_MESSAGE)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/cart')
    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument()
  })
})
