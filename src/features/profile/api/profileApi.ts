import { z } from 'zod'

import { http } from '@/infrastructure/http/axios'

import { mapProfile } from '../mappers/mapProfile'
import {
  profileDtoSchema,
  type ChangePasswordRequest,
  type UpdateProfileRequest,
} from '../schemas/profile.schemas'
import type { Profile } from '../types/profile'

export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
}

const avatarResponseSchema = z.object({ avatar_url: z.string() })

export async function fetchProfile(signal: AbortSignal): Promise<Profile> {
  const { data } = await http.get<unknown>('/profile', { signal })
  return mapProfile(profileDtoSchema.parse(data))
}

export async function updateProfile(input: UpdateProfileRequest): Promise<Profile> {
  const { data } = await http.patch<unknown>('/profile', input)
  return mapProfile(profileDtoSchema.parse(data))
}

export async function uploadAvatar(image: Blob): Promise<string> {
  const body = new FormData()
  body.append('avatar', image, 'avatar')
  const { data } = await http.put<unknown>('/profile/avatar', body)
  return avatarResponseSchema.parse(data).avatar_url
}

export async function removeAvatar(): Promise<void> {
  await http.delete('/profile/avatar')
}

export async function changePassword(input: ChangePasswordRequest): Promise<void> {
  await http.post('/profile/password', input)
}
