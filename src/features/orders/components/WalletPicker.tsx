import { Link } from '@tanstack/react-router'

import { networkLabels } from '@/features/catalog/constants'
import { walletTypeLabels } from '@/features/wallets/constants'
import type { Wallet } from '@/features/wallets/types/wallet'
import { shortenAddress } from '@/shared/lib/address'
import { cn } from '@/shared/lib/utils'

interface WalletPickerProps {
  wallets: Wallet[]
  value: string
  onChange: (walletId: string) => void
  disabled?: boolean
}

/** Escolha da carteira que recebe os NFTs. A rede da compra é a rede da carteira escolhida. */
export function WalletPicker({ wallets, value, onChange, disabled }: WalletPickerProps) {
  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-3">
      <legend className="mb-3 text-base leading-4 font-bold text-text-primary">
        Carteira que receberá os NFTs
      </legend>

      <div className="grid gap-3 md:grid-cols-2">
        {wallets.map((wallet) => {
          const selected = wallet.id === value
          return (
            <label
              key={wallet.id}
              className={cn(
                'flex min-w-0 cursor-pointer flex-col gap-2 rounded-lg border bg-surface-card p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                selected ? 'border-primary' : 'border-border hover:border-text-secondary',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="wallet"
                  value={wallet.id}
                  checked={selected}
                  onChange={() => {
                    onChange(wallet.id)
                  }}
                  className="size-4 shrink-0 accent-primary"
                />
                <span className="min-w-0 text-sm leading-4 font-bold text-text-primary">
                  {walletTypeLabels[wallet.type]}
                  <span className="font-normal text-text-secondary"> · {wallet.nickname}</span>
                </span>
              </span>
              <span className="pl-7 text-sm leading-4 break-all text-foreground">
                {wallet.ensName ? `${wallet.ensName}.eth` : shortenAddress(wallet.address)}
              </span>
              <span className="pl-7 text-xs leading-4 text-text-secondary">
                {networkLabels[wallet.network]}
              </span>
            </label>
          )
        })}
      </div>

      <p className="text-sm text-text-secondary">
        Quer usar outra carteira?{' '}
        <Link
          to="/profile/wallets"
          className="rounded-sm text-text-accent underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary"
        >
          Cadastre em Carteiras
        </Link>
        .
      </p>
    </fieldset>
  )
}
