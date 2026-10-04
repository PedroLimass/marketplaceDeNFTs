import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { patchSessionUser } from '@/features/auth/session/sessionCache'

import {
  changePassword,
  fetchProfile,
  profileKeys,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from '../api/profileApi'
import type { Profile } from '../types/profile'
import { resizeAvatar } from '../utils/resizeAvatar'

export const profileQueryOptions = () =>
  queryOptions({
    queryKey: profileKeys.detail(),
    queryFn: ({ signal }) => fetchProfile(signal),
  })

export function useProfile() {
  return useQuery(profileQueryOptions())
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.detail(), profile)
      patchSessionUser(queryClient, {
        displayName: profile.displayName,
        username: profile.username,
        email: profile.email,
        ensName: profile.ensName,
        walletNickname: profile.walletNickname,
      })
    },
  })
}

function applyAvatar(
  queryClient: ReturnType<typeof useQueryClient>,
  avatarUrl: string | null,
): void {
  queryClient.setQueryData<Profile>(profileKeys.detail(), (current) =>
    current ? { ...current, avatarUrl } : current,
  )
  patchSessionUser(queryClient, { avatarUrl })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => uploadAvatar(await resizeAvatar(file)),
    onSuccess: (avatarUrl) => {
      applyAvatar(queryClient, avatarUrl)
    },
  })
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeAvatar,
    onSuccess: () => {
      applyAvatar(queryClient, null)
    },
  })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}
