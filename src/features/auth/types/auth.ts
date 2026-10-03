export interface User {
  id: string
  username: string
  displayName: string
  email: string
  ensName: string | null
  walletNickname: string | null
  avatarUrl: string | null
}

export interface Session {
  user: User
  expiresAt: string
}

export interface AuthResult {
  session: Session
  accessToken: string
}
