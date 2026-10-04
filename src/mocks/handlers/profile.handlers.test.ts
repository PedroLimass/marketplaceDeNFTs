import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { AuthResponse } from '@/features/auth/schemas/auth.schemas'
import type { ProfileDto } from '@/features/profile/schemas/profile.schemas'
import { createHttpClient } from '@/infrastructure/http/axios'

import { initMockDb, resetMockDb } from '../db/mockDb'
import { setScenario } from '../scenarios/current'
import { authHandlers } from './auth.handlers'
import { profileHandlers } from './profile.handlers'

const server = setupServer(...authHandlers, ...profileHandlers)
const client = createHttpClient('http://localhost/api')

async function auth(email = 'nova@kurio.test', password = 'Kurio@2026') {
  const { data } = await client.post<AuthResponse>('/auth/login', { email, password })
  return { headers: { Authorization: `Bearer ${data.access_token}` } }
}

const valid = {
  display_name: 'Nova Alves',
  username: 'nova',
  email: 'nova@kurio.test',
  ens_name: 'nova',
  wallet_nickname: 'Principal',
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

describe('/profile', () => {
  it('exige sessão', async () => {
    await expect(client.get('/profile')).rejects.toMatchObject({ code: 'unauthenticated' })
  })

  it('devolve os dados do próprio usuário', async () => {
    const { data } = await client.get<ProfileDto>('/profile', await auth('rafael@kurio.test'))

    expect(data).toMatchObject({ username: 'rafael', email: 'rafael@kurio.test', avatar_url: null })
  })

  it('atualiza os dados e normaliza ENS e apelido vazios', async () => {
    const options = await auth()
    const { data } = await client.patch<ProfileDto>(
      '/profile',
      { ...valid, display_name: 'Nova A.', ens_name: 'Nova.ETH', wallet_nickname: '  ' },
      options,
    )

    expect(data).toMatchObject({ display_name: 'Nova A.', ens_name: 'nova', wallet_nickname: null })
    expect((await client.get<ProfileDto>('/profile', options)).data.display_name).toBe('Nova A.')
  })

  it('recusa e-mail e usuário de outra conta, mas aceita os próprios', async () => {
    const options = await auth()

    await expect(
      client.patch('/profile', { ...valid, email: 'rafael@kurio.test' }, options),
    ).rejects.toMatchObject({ status: 409, code: 'email_taken' })
    await expect(
      client.patch('/profile', { ...valid, username: 'Rafael' }, options),
    ).rejects.toMatchObject({ status: 409 })
    await expect(client.patch('/profile', valid, options)).resolves.toMatchObject({ status: 200 })
  })

  it('valida os campos', async () => {
    await expect(
      client.patch('/profile', { ...valid, email: 'invalido', username: 'a' }, await auth()),
    ).rejects.toMatchObject({
      status: 422,
      fieldErrors: { email: anyArray },
    })
  })

  it('guarda e remove o avatar, validando tipo e tamanho', async () => {
    const options = await auth()
    const send = (file: File) => {
      const body = new FormData()
      body.append('avatar', file)
      return client.put<{ avatar_url: string }>('/profile/avatar', body, options)
    }

    const { data } = await send(
      new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' }),
    )
    expect(data.avatar_url).toMatch(/^data:image\/png;base64,/)
    expect((await client.get<ProfileDto>('/profile', options)).data.avatar_url).toBe(
      data.avatar_url,
    )

    await expect(send(new File(['x'], 'a.gif', { type: 'image/gif' }))).rejects.toMatchObject({
      status: 415,
    })
    await expect(
      send(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' })),
    ).rejects.toMatchObject({ status: 413 })

    await client.delete('/profile/avatar', options)
    expect((await client.get<ProfileDto>('/profile', options)).data.avatar_url).toBeNull()
  })

  it('troca a senha: a antiga deixa de valer e a atual é exigida', async () => {
    const options = await auth()

    await expect(
      client.post(
        '/profile/password',
        { current_password: 'errada1', new_password: 'Nova@2027x' },
        options,
      ),
    ).rejects.toMatchObject({
      status: 422,
      code: 'invalid_current_password',
    })

    await client.post(
      '/profile/password',
      { current_password: 'Kurio@2026', new_password: 'Nova@2027x' },
      options,
    )

    await expect(auth('nova@kurio.test', 'Kurio@2026')).rejects.toMatchObject({
      code: 'invalid_credentials',
    })
    await expect(auth('nova@kurio.test', 'Nova@2027x')).resolves.toBeDefined()
  })

  it('rejeita nova senha fraca', async () => {
    await expect(
      client.post(
        '/profile/password',
        { current_password: 'Kurio@2026', new_password: 'abc' },
        await auth(),
      ),
    ).rejects.toMatchObject({ status: 422 })
  })
})
