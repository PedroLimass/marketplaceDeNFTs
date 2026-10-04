import { useEffect } from 'react'

import { AccountLoadError, AccountSkeleton } from '@/features/account/components/AccountStates'

import { PrimaryWalletSection, SecondaryWalletSection } from '../components/WalletSections'
import { useWallets } from '../hooks/useWallets'

export function WalletsPage() {
  const wallets = useWallets()

  useEffect(() => {
    document.title = 'Carteiras · Kurio'
    return () => {
      document.title = 'Kurio — Marketplace de NFTs'
    }
  }, [])

  if (wallets.isPending) return <AccountSkeleton label="Carregando carteiras" />

  if (wallets.isError) {
    return (
      <AccountLoadError
        error={wallets.error}
        subject="as carteiras"
        onRetry={() => {
          void wallets.refetch()
        }}
      />
    )
  }

  const primary = wallets.data.find((wallet) => wallet.role === 'primary')
  const secondary = wallets.data.find((wallet) => wallet.role === 'secondary')

  return (
    <div className="flex flex-col gap-12">
      <PrimaryWalletSection wallet={primary} />
      <SecondaryWalletSection wallet={secondary} primary={primary} />
    </div>
  )
}
