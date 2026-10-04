import { screen } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resetHttpHooks } from '@/infrastructure/http/interceptors'
import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'
import { authHandlers } from '@/mocks/handlers/auth.handlers'
import { catalogHandlers } from '@/mocks/handlers/catalog.handlers'
import { setScenario } from '@/mocks/scenarios/current'
import { renderAppAt } from '@/test/renderApp'

const server = setupServer(...authHandlers, ...catalogHandlers)

describe('HeaderSearch', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(async () => {
    await initMockDb()
    await resetMockDb()
    setScenario('default')
    window.localStorage.clear()
  })

  afterEach(() => {
    server.resetHandlers()
    resetHttpHooks()
  })

  afterAll(() => {
    server.close()
  })

  it('abre o campo no cabeçalho e fecha com Escape', async () => {
    const { user } = await renderAppAt('/')
    await screen.findByRole('heading', { name: 'Emerald Ape #042' })

    await user.click(screen.getByRole('button', { name: 'Buscar NFTs' }))
    const field = screen.getByPlaceholderText('Buscar NFTs')
    expect(field).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Buscar NFTs' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Buscar NFTs')).not.toBeInTheDocument()
  })
})
