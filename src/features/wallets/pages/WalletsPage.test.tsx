import { screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { resetHttpHooks } from '@/infrastructure/http/interceptors'
import { initMockDb, resetMockDb } from '@/mocks/db/mockDb'
import { handlers } from '@/mocks/handlers'
import { setScenario } from '@/mocks/scenarios/current'
import { toast } from '@/shared/lib/toast'
import { renderAppAt } from '@/test/renderApp'

const server = setupServer(...handlers)

const primaryForm = () => within(screen.getByRole('form', { name: 'Carteira principal' }))
const secondaryForm = () => within(screen.getByRole('form', { name: 'Carteira secundária' }))

async function openWallets(email = 'nova@kurio.test') {
  const app = await renderAppAt('/login?redirect=%2Fprofile%2Fwallets')
  await app.user.type(await screen.findByLabelText('E-mail'), email)
  await app.user.type(screen.getByLabelText('Senha'), 'Kurio@2026')
  await app.user.click(screen.getByRole('button', { name: 'Entrar' }))
  await screen.findByRole('heading', { name: 'Carteira principal' })
  return app
}

describe('Carteiras', { timeout: 15_000 }, () => {
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

  it('exige login e volta às carteiras depois de entrar', async () => {
    const { router } = await renderAppAt('/profile/wallets')

    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toMatchObject({ redirect: '/profile/wallets' })
  })

  it('mostra a principal e a secundária já cadastradas', async () => {
    await openWallets()

    expect(await screen.findByRole('form', { name: 'Carteira secundária' })).toBeVisible()
    expect(primaryForm().getByLabelText(/Endereço da carteira/)).toHaveValue(
      '0xA91F4c27B3d58e61F09a7D2c4E8b13560F9dE82C',
    )
    expect(primaryForm().getByLabelText(/Tipo de carteira/)).toHaveValue('metamask')
    expect(primaryForm().getByLabelText(/Rede/)).toHaveValue('ethereum')
    expect(secondaryForm().getByLabelText(/Apelido da carteira/)).toHaveValue('Reserva')
    expect(secondaryForm().getByLabelText(/Rede/)).toHaveValue('polygon')
    expect(document.title).toBe('Carteiras · Kurio')
  })

  it('salva uma alteração na principal', async () => {
    const { user } = await openWallets()

    const nickname = primaryForm().getByLabelText(/Apelido da carteira/)
    await user.clear(nickname)
    await user.type(nickname, 'Cofre frio')
    await user.click(primaryForm().getByRole('button', { name: 'Salvar carteira' }))

    expect(await screen.findByText('Carteira principal salva.')).toBeVisible()
    expect(primaryForm().getByLabelText(/Apelido da carteira/)).toHaveValue('Cofre frio')
  })

  it('valida o endereço e os selects antes de enviar', async () => {
    const { user } = await openWallets('rafael@kurio.test')

    await user.click(await screen.findByRole('button', { name: /Adicionar carteira secundária/ }))
    await user.type(secondaryForm().getByLabelText(/Endereço da carteira/), '0x123')
    await user.click(secondaryForm().getByRole('button', { name: 'Salvar carteira' }))

    expect(await screen.findByText('Selecione uma rede.')).toBeVisible()
    expect(screen.getByText('Selecione uma carteira.')).toBeVisible()
    expect(screen.getByText(/0x seguido de 40 caracteres/)).toBeVisible()
    expect(screen.getByText('Informe um apelido para a carteira.')).toBeVisible()
  })

  it('cadastra a secundária de quem ainda não tem', async () => {
    const { user } = await openWallets('rafael@kurio.test')

    expect(
      await screen.findByText('Você ainda não adicionou uma carteira secundária.'),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: /Adicionar carteira secundária/ }))

    await user.selectOptions(secondaryForm().getByLabelText(/Rede/), 'solana')
    await user.selectOptions(secondaryForm().getByLabelText(/Tipo de carteira/), 'coinbase')
    await user.type(
      secondaryForm().getByLabelText(/Endereço da carteira/),
      '0x1111111111111111111111111111111111111111',
    )
    await user.type(secondaryForm().getByLabelText(/Apelido da carteira/), 'Cofre')
    await user.click(secondaryForm().getByRole('button', { name: 'Salvar carteira' }))

    expect(await screen.findByText('Carteira secundária salva.')).toBeVisible()
    expect(secondaryForm().getByLabelText(/Apelido da carteira/)).toHaveValue('Cofre')
  })

  it('mostra no campo o erro do servidor para o endereço repetido da principal', async () => {
    const { user } = await openWallets('rafael@kurio.test')

    await user.click(await screen.findByRole('button', { name: /Adicionar carteira secundária/ }))
    await user.selectOptions(secondaryForm().getByLabelText(/Rede/), 'ethereum')
    await user.selectOptions(secondaryForm().getByLabelText(/Tipo de carteira/), 'metamask')
    await user.type(
      secondaryForm().getByLabelText(/Endereço da carteira/),
      '0x5d1B8e0F3aC9724b6E1f08D3c7A25b94e60F13a8',
    )
    await user.type(secondaryForm().getByLabelText(/Apelido da carteira/), 'Cópia')
    await user.click(secondaryForm().getByRole('button', { name: 'Salvar carteira' }))

    expect(await screen.findByText(/já é o da carteira principal/)).toBeVisible()
  })

  it('"Igual à carteira principal" usa a principal e permite personalizar de novo', async () => {
    const { user } = await openWallets('rafael@kurio.test')

    await user.click(await screen.findByRole('checkbox', { name: 'Igual à carteira principal' }))

    expect(
      await screen.findByText('Os dados desta carteira acompanham a carteira principal.'),
    ).toBeVisible()
    expect(screen.queryByRole('form', { name: 'Carteira secundária' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Igual à carteira principal' }))
    expect(await screen.findByRole('form', { name: 'Carteira secundária' })).toBeVisible()
    expect(secondaryForm().getByLabelText(/Apelido da carteira/)).toHaveValue('Principal')
  })

  it('mostra erro com nova tentativa quando as carteiras não carregam', async () => {
    const { user, router } = await openWallets()
    await router.navigate({ to: '/profile' })
    setScenario('server-error')

    const [link] = screen.getAllByRole('link', { name: 'Carteiras' })
    if (!link) throw new Error('Link de carteiras não encontrado.')
    await user.click(link)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  })
})
