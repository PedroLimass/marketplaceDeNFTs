import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { AuthResponse } from '@/features/auth/schemas/auth.schemas'
import type { WalletDto, WalletsResponse } from '@/features/wallets/schemas/wallet.schemas'
import { createHttpClient } from '@/infrastructure/http/axios'

import { initMockDb, resetMockDb } from '../db/mockDb'
import { setScenario } from '../scenarios/current'
import { authHandlers } from './auth.handlers'
import { walletsHandlers } from './wallets.handlers'

const server = setupServer(...authHandlers, ...walletsHandlers)
const client = createHttpClient('http://localhost/api')

async function auth(email = 'nova@kurio.test') {
  const { data } = await client.post<AuthResponse>('/auth/login', {
    email,
    password: 'Kurio@2026',
  })
  return { headers: { Authorization: `Bearer ${data.access_token}` } }
}

const list = async (options: Awaited<ReturnType<typeof auth>>) =>
  (await client.get<WalletsResponse>('/wallets', options)).data.items

const fields = {
  type: 'coinbase',
  network: 'solana',
  address: '0x1111111111111111111111111111111111111111',
  nickname: 'Cofre',
  ens_name: 'Cofre.eth',
}

const anyArray: unknown = expect.any(Array)

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

describe('/wallets', () => {
  it('exige sessão', async () => {
    await expect(client.get('/wallets')).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('lista a principal antes da secundária, cada usuário com as suas', async () => {
    const nova = await list(await auth())
    const rafael = await list(await auth('rafael@kurio.test'))

    expect(nova.map((wallet) => wallet.role)).toEqual(['primary', 'secondary'])
    expect(nova[0]).toMatchObject({ type: 'metamask', network: 'ethereum', nickname: 'Principal' })
    expect(nova[1]).toMatchObject({
      network: 'polygon',
      nickname: 'Reserva',
      ens_name: 'nova.kurio',
    })
    expect(rafael.map((wallet) => wallet.role)).toEqual(['primary'])
  })

  it('cadastra a secundária de quem ainda não tem e atualiza sem trocar o id', async () => {
    const options = await auth('rafael@kurio.test')

    const created = await client.put<WalletDto>('/wallets/secondary', fields, options)
    expect(created.status).toBe(201)
    expect(created.data).toMatchObject({ role: 'secondary', ens_name: 'cofre' })

    const updated = await client.put<WalletDto>(
      '/wallets/secondary',
      { ...fields, nickname: 'Cofre 2' },
      options,
    )
    expect(updated.status).toBe(200)
    expect(updated.data).toMatchObject({ id: created.data.id, nickname: 'Cofre 2' })
    expect(await list(options)).toHaveLength(2)
  })

  it('valida endereço, tipo e rede', async () => {
    const options = await auth()

    await expect(
      client.put('/wallets/primary', { ...fields, address: '0x123' }, options),
    ).rejects.toMatchObject({
      status: 422,
      fieldErrors: { address: anyArray },
    })
    await expect(
      client.put('/wallets/primary', { ...fields, type: 'ledger' }, options),
    ).rejects.toMatchObject({ status: 422 })
    await expect(client.put('/wallets/terciaria', fields, options)).rejects.toMatchObject({
      status: 404,
    })
  })

  it('recusa na secundária o mesmo endereço da principal', async () => {
    const options = await auth()
    const [primary] = await list(options)

    await expect(
      client.put('/wallets/secondary', { ...fields, address: primary?.address }, options),
    ).rejects.toMatchObject({
      status: 422,
      fieldErrors: { address: anyArray },
    })
  })

  it('"igual à principal" espelha a principal, mesmo depois de ela mudar', async () => {
    const options = await auth()
    await client.put('/wallets/secondary', { same_as_primary: true }, options)

    let [primary, secondary] = await list(options)
    expect(secondary).toMatchObject({ same_as_primary: true, address: primary?.address })

    await client.put('/wallets/primary', { ...fields, nickname: 'Nova principal' }, options)
    ;[primary, secondary] = await list(options)
    expect(secondary).toMatchObject({ same_as_primary: true, nickname: 'Nova principal' })
  })

  it('não aceita "igual à principal" na própria principal', async () => {
    await expect(
      client.put('/wallets/primary', { same_as_primary: true }, await auth()),
    ).rejects.toMatchObject({ status: 422 })
  })

  it('simula conexão e desconexão; o cenário wallet-refused recusa', async () => {
    const options = await auth()
    const [primary] = await list(options)

    const connected = await client.post(`/wallets/${primary?.id}/connect`, null, options)
    expect(connected.data).toEqual({ status: 'connected' })
    expect((await client.post(`/wallets/${primary?.id}/disconnect`, null, options)).status).toBe(
      204,
    )

    setScenario('wallet-refused')
    await expect(
      client.post(`/wallets/${primary?.id}/connect`, null, options),
    ).rejects.toMatchObject({
      status: 403,
      code: 'wallet_connection_refused',
    })

    await expect(client.post('/wallets/outra/connect', null, options)).rejects.toMatchObject({
      status: 404,
    })
  })
})
