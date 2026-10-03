import type { UserDto } from '@/features/auth/schemas/auth.schemas'

import type { UserRecord } from '../db/types'

export function toUserDto(user: UserRecord): UserDto {
  return {
    id: user.id,
    username: user.username,
    display_name: user.displayName,
    email: user.email,
    ens_name: user.ensName,
    wallet_nickname: user.walletNickname,
    avatar_url: user.avatarUrl,
  }
}
