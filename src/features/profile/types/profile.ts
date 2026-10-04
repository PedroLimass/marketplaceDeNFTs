export interface Profile {
  displayName: string
  username: string
  email: string
  /** Rótulo ENS sem o sufixo `.eth`. */
  ensName: string | null
  walletNickname: string | null
  avatarUrl: string | null
}
