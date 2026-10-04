export interface UserFixture {
  id: string
  username: string
  displayName: string
  email: string
  password: string

  passwordSalt: string
  passwordHash: string
  ensName: string | null
  walletNickname: string | null
}

export const userFixtures: readonly UserFixture[] = [
  {
    id: 'usr_nova',
    username: 'nova',
    displayName: 'Nova Alves',
    email: 'nova@kurio.test',
    password: 'Kurio@2026',
    passwordSalt: 'a3VyaW86dXNyX25vdmE=',
    passwordHash: 'u+JjHRTFauiyB+dBjZLyW7YSThpR5dIS3Z/ceFiSvfw=',
    ensName: 'nova',
    walletNickname: 'Principal',
  },
  {
    id: 'usr_rafael',
    username: 'rafael',
    displayName: 'Rafael Costa',
    email: 'rafael@kurio.test',
    password: 'Kurio@2026',
    passwordSalt: 'a3VyaW86dXNyX3JhZmFlbA==',
    passwordHash: 'R2FmYI9QyxZEMsQ+eAKjyRqdAfZ39g/uyqmDDLC/rW4=',
    ensName: null,
    walletNickname: null,
  },
]
