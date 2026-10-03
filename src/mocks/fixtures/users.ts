export interface UserFixture {
  id: string
  username: string
  displayName: string
  email: string
  /** Credencial fictícia, documentada no README. O banco só guarda o hash. */
  password: string
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
    ensName: 'nova',
    walletNickname: 'Principal',
  },
  {
    id: 'usr_rafael',
    username: 'rafael',
    displayName: 'Rafael Costa',
    email: 'rafael@kurio.test',
    password: 'Kurio@2026',
    ensName: null,
    walletNickname: null,
  },
]
