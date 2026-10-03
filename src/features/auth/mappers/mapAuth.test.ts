import { describe, expect, it } from 'vitest'

import type { UserDto } from '../schemas/auth.schemas'
import { mapAuthResponse, mapSessionResponse, mapUser } from './mapAuth'

const dto: UserDto = {
  id: 'usr_nova',
  username: 'nova',
  display_name: 'Nova Alves',
  email: 'nova@kurio.test',
  ens_name: 'nova',
  wallet_nickname: 'Principal',
  avatar_url: null,
}

const user = {
  id: 'usr_nova',
  username: 'nova',
  displayName: 'Nova Alves',
  email: 'nova@kurio.test',
  ensName: 'nova',
  walletNickname: 'Principal',
  avatarUrl: null,
}

describe('mapAuth', () => {
  it('converte o usuário de snake_case para camelCase', () => {
    expect(mapUser(dto)).toEqual(user)
  })

  it('separa o token da sessão ao mapear login e cadastro', () => {
    expect(
      mapAuthResponse({ user: dto, access_token: 'tok', expires_at: '2026-07-29T15:00:00.000Z' }),
    ).toEqual({
      accessToken: 'tok',
      session: { user, expiresAt: '2026-07-29T15:00:00.000Z' },
    })
  })

  it('transforma visitante em null e usuário logado em sessão', () => {
    expect(mapSessionResponse({ user: null, expires_at: null })).toBeNull()
    expect(mapSessionResponse({ user: dto, expires_at: '2026-07-29T15:00:00.000Z' })).toEqual({
      user,
      expiresAt: '2026-07-29T15:00:00.000Z',
    })
  })
})
