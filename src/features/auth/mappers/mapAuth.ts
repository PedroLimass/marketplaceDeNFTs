import type { AuthResponse, SessionResponse, UserDto } from '../schemas/auth.schemas'
import type { AuthResult, Session, User } from '../types/auth'

export function mapUser(dto: UserDto): User {
  return {
    id: dto.id,
    username: dto.username,
    displayName: dto.display_name,
    email: dto.email,
    ensName: dto.ens_name,
    walletNickname: dto.wallet_nickname,
    avatarUrl: dto.avatar_url,
  }
}

export function mapAuthResponse(dto: AuthResponse): AuthResult {
  return {
    accessToken: dto.access_token,
    session: { user: mapUser(dto.user), expiresAt: dto.expires_at },
  }
}

export function mapSessionResponse(dto: SessionResponse): Session | null {
  if (!dto.user || !dto.expires_at) return null

  return { user: mapUser(dto.user), expiresAt: dto.expires_at }
}
