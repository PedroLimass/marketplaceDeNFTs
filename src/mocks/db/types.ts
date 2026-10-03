export const DB_SCHEMA_VERSION = 1

export interface UserRecord {
  id: string
  username: string
  displayName: string
  email: string
  passwordSalt: string
  passwordHash: string
  ensName: string | null
  walletNickname: string | null
  avatarUrl: string | null
  createdAt: string
}

export interface SessionRecord {
  token: string
  userId: string
  /** Instante de expiração, em milissegundos desde a época Unix. */
  expiresAt: number
}

export interface MockDbState {
  schemaVersion: number
  users: UserRecord[]
  sessions: SessionRecord[]
}
