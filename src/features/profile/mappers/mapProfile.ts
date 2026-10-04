import type { ProfileDto } from '../schemas/profile.schemas'
import type { Profile } from '../types/profile'

export function mapProfile(dto: ProfileDto): Profile {
  return {
    displayName: dto.display_name,
    username: dto.username,
    email: dto.email,
    ensName: dto.ens_name,
    walletNickname: dto.wallet_nickname,
    avatarUrl: dto.avatar_url,
  }
}
