import { walletTypeLabels } from '@/features/wallets/constants'
import { walletTypes } from '@/features/wallets/schemas/wallet.schemas'
import type { Wallet } from '@/features/wallets/types/wallet'
import { cn } from '@/shared/lib/utils'

interface WalletPickerProps {
  wallets: Wallet[]
  value: string
  onChange: (walletId: string) => void
  disabled?: boolean
}

export function WalletPicker({ wallets, value, onChange, disabled }: WalletPickerProps) {
  const selected = wallets.find((wallet) => wallet.id === value)

  return (
    <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-5">
      <legend className="w-full text-center text-[17px] leading-4 font-bold text-text-primary">
        Carteira e rede
      </legend>

      <div className="flex flex-col gap-4">
        {walletTypes.map((type) => {
          const match = wallets.find((wallet) => wallet.type === type)
          const isSelected = match !== undefined && match.id === selected?.id
          return (
            <label
              key={type}
              className={cn(
                'flex h-[45px] cursor-pointer items-center gap-2.5 rounded-[3px] border px-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                isSelected ? 'border-primary' : 'border-border hover:border-text-secondary',
                (disabled || !match) && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name="wallet"
                value={type}
                checked={isSelected}
                disabled={!match}
                onChange={() => {
                  if (match) onChange(match.id)
                }}
                className="size-4 shrink-0 accent-primary"
              />
              <span className="text-[15px] leading-none text-foreground">
                {walletTypeLabels[type]}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
