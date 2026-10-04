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

  // A chave recria o formulário quando o servidor devolve dados diferentes dos exibidos. O avatar
  // fica de fora: ele é salvo à parte e não pode descartar o que a pessoa está digitando.
  const formKey = JSON.stringify({ ...profile.data, avatarUrl: null })
  return <ProfileForm key={formKey} profile={profile.data} />
}
