import { useEffect } from 'react'

import { AccountLoadError, AccountSkeleton } from '@/features/account/components/AccountStates'

import { ProfileForm } from '../components/ProfileForm'
import { useProfile } from '../hooks/useProfile'

export function ProfilePage() {
  const profile = useProfile()

  useEffect(() => {
    document.title = 'Perfil do colecionador · Kurio'
    return () => {
      document.title = 'Kurio — Marketplace de NFTs'
    }
  }, [])

  if (profile.isPending) return <AccountSkeleton label="Carregando perfil" />

  if (profile.isError) {
    return (
      <AccountLoadError
        error={profile.error}
        subject="o perfil"
        onRetry={() => {
          void profile.refetch()
        }}
      />
    )
  }

  const formKey = JSON.stringify({ ...profile.data, avatarUrl: null })
  return <ProfileForm key={formKey} profile={profile.data} />
}
