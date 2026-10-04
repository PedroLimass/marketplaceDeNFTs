import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import * as profileApi from '@/features/profile/api/profileApi'
import { resetHttpHooks } from '@/infrastructure/http/interceptors'
import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'
import { handlers } from '@/mocks/handlers'
import { setScenario } from '@/mocks/scenarios/current'
import { toast } from '@/shared/lib/toast'
import { renderAppAt } from '@/test/renderApp'

const server = setupServer(...handlers)

const form = () => within(screen.getByRole('form', { name: 'Perfil do colecionador' }))

async function openProfile(path = '/profile') {
  const app = await renderAppAt('/login?redirect=' + encodeURIComponent(path))
  await app.user.type(await screen.findByLabelText('E-mail'), 'nova@kurio.test')
  await app.user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
  await app.user.click(screen.getByRole('button', { name: 'Entrar' }))
  await screen.findByLabelText('Nome de exibição', { exact: false })
  return app
}

describe('Perfil do colecionador', () => {
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
    vi.restoreAllMocks()
  })

  afterAll(() => {
    server.close()
  })

  it('manda o visitante para o login e volta ao perfil depois de entrar', async () => {
    const { router } = await renderAppAt('/profile')

    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toMatchObject({ redirect: '/profile' })
  })

  it('mostra os dados da conta no formulário', async () => {
    await openProfile()

    expect(screen.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    expect(screen.getByLabelText(/Nome de exibição/)).toHaveValue('Nova Alves')
    expect(screen.getByLabelText(/Nome de usuário/)).toHaveValue('nova')
    expect(form().getByLabelText(/E-mail/)).toHaveValue('nova@kurio.test')
    expect(screen.getByLabelText('Nome ENS')).toHaveValue('nova')
    expect(document.title).toBe('Perfil do colecionador · Kurio')
  })

  it('salva as alterações e atualiza o nome no cabeçalho', async () => {
    const { user } = await openProfile()

    const name = screen.getByLabelText(/Nome de exibição/)
    await user.clear(name)
    await user.type(name, 'Nova Silva')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Perfil atualizado.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Meu perfil, Nova Silva' })).toBeInTheDocument()
  })

  it('avisa quando não há nada para salvar', async () => {
    const { user } = await openProfile()

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Nenhuma alteração para salvar.')).toBeVisible()
  })

  it('mostra no campo o erro de e-mail já usado por outra conta', async () => {
    const { user } = await openProfile()

    const email = form().getByLabelText(/E-mail/)
    await user.clear(email)
    await user.type(email, 'rafael@kurio.test')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Este e-mail já está em uso.')).toBeVisible()
    expect(email).toBeInvalid()
  })

  it('valida os campos antes de enviar', async () => {
    const { user } = await openProfile()

    const username = screen.getByLabelText(/Nome de usuário/)
    await user.clear(username)
    await user.type(username, 'a')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText(/ao menos 3 caracteres/)).toBeVisible()
  })

  it('exige os três campos de senha quando um deles é preenchido', async () => {
    const { user } = await openProfile()

    await user.type(screen.getByLabelText('Nova senha'), 'Nova@2027x')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Informe a senha atual.')).toBeVisible()
    expect(screen.getByText('Confirme a nova senha.')).toBeVisible()
  })

  it('mostra o erro da senha atual incorreta no campo', async () => {
    const { user } = await openProfile()

    await user.type(screen.getByLabelText('Senha atual'), 'Errada@123')
    await user.type(screen.getByLabelText('Nova senha'), 'Nova@2027x')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'Nova@2027x')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('A senha atual está incorreta.')).toBeVisible()
  })

  it('troca a senha e limpa os campos', async () => {
    const { user } = await openProfile()

    await user.type(screen.getByLabelText('Senha atual'), 'Kurio@2026')
    await user.type(screen.getByLabelText('Nova senha'), 'Nova@2027x')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'Nova@2027x')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Senha alterada.')).toBeVisible()
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')
  })

  it('recusa um avatar de formato ou tamanho inválidos sem chamar a API', async () => {
    const upload = vi.spyOn(profileApi, 'uploadAvatar')
    await openProfile()
    const input = screen.getByLabelText('Arquivo do avatar')

    fireEvent.change(input, {
      target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] },
    })
    expect(await screen.findByText('Use uma imagem JPG, PNG ou WebP.')).toBeVisible()

    fireEvent.change(input, {
      target: {
        files: [new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' })],
      },
    })
    expect(await screen.findByText('A imagem deve ter no máximo 2 MB.')).toBeVisible()
    expect(upload).not.toHaveBeenCalled()
  })

  it('troca e remove o avatar', async () => {
    const dataUrl = 'data:image/png;base64,AAAA'
    vi.spyOn(profileApi, 'uploadAvatar').mockResolvedValue(dataUrl)
    const { user } = await openProfile()

    await user.upload(
      screen.getByLabelText('Arquivo do avatar'),
      new File(['x'], 'a.png', { type: 'image/png' }),
    )

    const avatar = await screen.findByRole('img', { name: 'Seu avatar' })
    expect(avatar).toHaveAttribute('src', dataUrl)

    await user.click(screen.getByRole('button', { name: 'Remover' }))
    await waitFor(() => {
      expect(screen.queryByRole('img', { name: 'Seu avatar' })).not.toBeInTheDocument()
    })
  })

  it('mostra erro com nova tentativa quando o perfil não carrega', async () => {
    const { user } = await openProfile()
    setScenario('server-error')

    const [link] = screen.getAllByRole('link', { name: 'Carteiras' })
    if (!link) throw new Error('Link de carteiras não encontrado.')
    await user.click(link)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(
      within(screen.getByRole('alert')).getByRole('button', { name: 'Tentar novamente' }),
    ).toBeVisible()
  })
})
