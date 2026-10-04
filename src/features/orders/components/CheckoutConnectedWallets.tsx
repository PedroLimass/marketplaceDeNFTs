import { Link } from '@tanstack/react-router'
import { MoreVertical } from 'lucide-react'

import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'
import type { Wallet } from '@/features/wallets/types/wallet'
import { shortenAddress } from '@/shared/lib/address'
import { cn } from '@/shared/lib/utils'

const mobileNetworkLabels: Record<NetworkId, string> = {
  ethereum: 'Ethereum Mainnet',
  polygon: 'Polygon',
  solana: 'Solana',
}

const roleLabels = {
  primary: 'Principal',
  secondary: 'Reserva',
} as const

interface CheckoutConnectedWalletsProps {
  wallets: Wallet[]
  value: string
  disabled?: boolean
  onChange: (walletId: string) => void
}

export function CheckoutConnectedWallets({
  wallets,
  value,
  disabled,
  onChange,
}: CheckoutConnectedWalletsProps) {
  const ordered = [...wallets].sort((left, right) => {
    if (left.role === right.role) return 0
    return left.role === 'secondary' ? -1 : 1
  })

  return (
    <section className="flex flex-col gap-4 md:hidden" aria-labelledby="carteira-conectada-titulo">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="carteira-conectada-titulo"
          className="text-[15px] leading-4 font-bold text-foreground"
        >
          Carteira conectada
        </h2>
        <Link
          to="/profile/wallets"
          className="text-[15px] text-text-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary"
        >
          Trocar carteira
        </Link>
      </div>

      <ul className="flex flex-col gap-5">
        {ordered.map((wallet) => {
          const selected = wallet.id === value
          const identity = wallet.ensName ? `${wallet.ensName}.eth` : shortenAddress(wallet.address)
          return (
            <li key={wallet.id}>
              <label
                className={cn(
                  'relative flex min-h-[93px] cursor-pointer items-center gap-4 rounded-[6px] border bg-surface-card px-4 py-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                  selected ? 'border-primary' : 'border-border',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <input
                  type="radio"
                  name="wallet-card"
                  value={wallet.id}
                  checked={selected}
                  disabled={disabled}
                  onChange={() => {
                    onChange(wallet.id)
                  }}
                  className="size-4 shrink-0 accent-primary"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[15px] leading-4 font-bold text-text-primary">
                    {roleLabels[wallet.role]}
                  </span>
                  <span className="text-sm leading-5 text-text-secondary">
                    {identity}
                    <br />
                    {wallet.ensName
                      ? `Rede ${mobileNetworkLabels[wallet.network]}`
                      : mobileNetworkLabels[wallet.network]}
                  </span>
                </span>
                <MoreVertical aria-hidden="true" className="size-4 text-text-secondary" />
              </label>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
