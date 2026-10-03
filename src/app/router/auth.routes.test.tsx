import { screen, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { TOKEN_STORAGE_KEY } from '@/features/auth/storage/tokenStorage'
import { resetHttpHooks } from '@/infrastructure/http/interceptors'
import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'
import { authHandlers } from '@/mocks/handlers/auth.handlers'
import { setScenario } from '@/mocks/scenarios/current'
import { renderAppAt } from '@/test/renderApp'

const server = setupServer(...authHandlers)

describe('rotas de autenticação', () => {
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

  it('mostra o botão Entrar para visitante', async () => {
    await renderAppAt('/')

    expect(await screen.findByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
  })

  it('abre o login como modal sobre o Início', async () => {
    await renderAppAt('/login')

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    // O Radix marca o conteúdo atrás do modal como oculto para leitores de tela.
    expect(screen.getByRole('heading', { level: 1, hidden: true })).toHaveTextContent('SEJA DONO')
  })

  it('entra com credenciais válidas e volta ao Início já autenticado', async () => {
    const { user, router } = await renderAppAt('/login')

    await user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
    await user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('button', { name: 'Sair' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toMatch(/\S/)
  })

  it('volta ao destino interno informado em redirect', async () => {
    const { user, router } = await renderAppAt('/login?redirect=%2Fnada-por-aqui')

    await user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
    await user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/nada-por-aqui')
    })
  })

  it('ignora um redirect para outro domínio', async () => {
    const { user, router } = await renderAppAt('/login?redirect=https%3A%2F%2Fmalicioso.example')

    await user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
    await user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await screen.findByRole('button', { name: 'Sair' })
    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.href).toBe('/')
  })

  it('mostra erro genérico sem dizer qual credencial falhou', async () => {
    const { user } = await renderAppAt('/login')

    await user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
    await user.type(screen.getByLabelText('Senha'), 'senhaErrada1')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('valida campos vazios antes de chamar a API', async () => {
    const { user } = await renderAppAt('/login')

    await user.click(await screen.findByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
  })

  it('redireciona quem já está autenticado para fora do login', async () => {
    const first = await renderAppAt('/login')
    await first.user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
    await first.user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
    await first.user.click(screen.getByRole('button', { name: 'Entrar' }))
    await screen.findByRole('button', { name: 'Sair' })

    const { router } = await renderAppAt('/login')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })
  })

  it('avisa que o login social não está disponível, sem autenticar', async () => {
    const { user } = await renderAppAt('/login')

    await user.click(await screen.findByRole('button', { name: /Google/ }))

    expect(await screen.findByRole('status')).toHaveTextContent('Indisponível nesta demonstração')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('alterna entre Entrar e Criar conta mantendo o destino', async () => {
    const { user, router } = await renderAppAt('/login?redirect=%2Fnada-por-aqui')

    await user.click(await screen.findByRole('link', { name: 'Criar conta' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/signup')
    })
    expect(router.state.location.search).toEqual({ redirect: '/nada-por-aqui' })
  })

  it('exige confirmação de senha igual no cadastro', async () => {
    const { user } = await renderAppAt('/signup')

    await user.type(await screen.findByLabelText('Nome de usuário'), 'camila')
    await user.type(screen.getByLabelText('E-mail'), 'camila@kurio.test')
    await user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
    await user.type(screen.getByLabelText('Confirmar senha'), 'Outra@2026')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('As senhas não coincidem.')).toBeInTheDocument()
  })

  it('mostra o conflito do servidor no campo de e-mail', async () => {
    const { user } = await renderAppAt('/signup')

    await user.type(await screen.findByLabelText('Nome de usuário'), 'camila')
    await user.type(screen.getByLabelText('E-mail'), 'nova@kurio.test')
    await user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
    await user.type(screen.getByLabelText('Confirmar senha'), 'Kurio@2026')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Este e-mail já está em uso.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
  })

  it('cria a conta e já entra autenticado', async () => {
    const { user } = await renderAppAt('/signup')

    await user.type(await screen.findByLabelText('Nome de usuário'), 'camila')
    await user.type(screen.getByLabelText('E-mail'), 'camila@kurio.test')
    await user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
    await user.type(screen.getByLabelText('Confirmar senha'), 'Kurio@2026')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('button', { name: 'Sair' })).toBeInTheDocument()
    expect(screen.getByText('camila')).toBeInTheDocument()
  })

  it('sai da conta e volta a ser visitante', async () => {
    const { user } = await renderAppAt('/login')
    await user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
    await user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await user.click(await screen.findByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('link', { name: 'Entrar' })).toBeInTheDocument()
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })
})
