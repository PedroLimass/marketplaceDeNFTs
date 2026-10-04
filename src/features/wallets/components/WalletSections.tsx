import { useId, useState } from 'react'

import { applyApiMessage } from '@/shared/lib/forms/applyApiError'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'

import { useSaveWallet } from '../hooks/useWallets'
import type { Wallet } from '../types/wallet'
import { WalletForm } from './WalletForm'

const headingClass = 'text-base leading-4 font-bold text-text-primary'

function Empty({ children }: { children: string }) {
  return <p className="text-sm leading-[15px] text-text-secondary">{children}</p>
}

export function PrimaryWalletSection({ wallet }: { wallet: Wallet | undefined }) {
  const [adding, setAdding] = useState(false)
  const showForm = wallet !== undefined || adding

  return (
    <section aria-labelledby="carteira-principal" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h1 id="carteira-principal" className={headingClass}>
            Carteira principal
          </h1>
          {!showForm ? (
            <Button
              type="button"
              variant="link"
              className="text-sm"
              onClick={() => {
                setAdding(true)
              }}
            >
              Adicionar <span className="sr-only">carteira principal</span>
            </Button>
          ) : null}
        </div>
        <p className="text-sm leading-[15px] text-text-secondary">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
      </div>

      {showForm ? (
        <WalletForm
          key={wallet ? JSON.stringify(wallet) : 'new'}
          walletRole="primary"
          initial={wallet}
          {...(wallet
            ? {}
            : {
                onCancel: () => {
                  setAdding(false)
                },
              })}
        />
      ) : (
        <Empty>Você ainda não adicionou uma carteira principal.</Empty>
      )}
    </section>
  )
}

export function SecondaryWalletSection({
  wallet,
  primary,
}: {
  wallet: Wallet | undefined
  primary: Wallet | undefined
}) {
  const checkboxId = useId()
  const save = useSaveWallet()
  const [adding, setAdding] = useState(false)
  const [customizing, setCustomizing] = useState(false)

  const sameAsPrimary = wallet?.sameAsPrimary === true
  const showForm = (wallet !== undefined && !sameAsPrimary) || adding || customizing

  const toggleSameAsPrimary = (checked: boolean) => {
    if (!checked) {
      setCustomizing(true)
      return
    }

    save.mutate(
      { role: 'secondary', input: { same_as_primary: true } },
      {
        onSuccess: () => {
          setAdding(false)
          setCustomizing(false)
          toast.success('A carteira secundária agora é igual à principal.')
        },
        onError: (error) => {
          toast.error(applyApiMessage(error))
        },
      },
    )
  }

  return (
    <section aria-labelledby="carteira-secundaria" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 id="carteira-secundaria" className={headingClass}>
          Carteira secundária
        </h2>
        <div className="flex items-center gap-6">
          <label
            htmlFor={checkboxId}
            className="flex min-h-6 cursor-pointer items-center gap-2 text-sm text-text-primary has-disabled:cursor-not-allowed has-disabled:opacity-50"
          >
            <input
              id={checkboxId}
              type="checkbox"
              checked={sameAsPrimary && !customizing}
              disabled={!primary || save.isPending}
              onChange={(event) => {
                toggleSameAsPrimary(event.target.checked)
              }}
              className="size-4 cursor-pointer rounded-full accent-primary disabled:cursor-not-allowed"
            />
            Igual à carteira principal
          </label>
          {!wallet && !adding ? (
            <Button
              type="button"
              variant="link"
              className="text-sm"
              onClick={() => {
                setAdding(true)
              }}
            >
              Adicionar <span className="sr-only">carteira secundária</span>
            </Button>
          ) : null}
        </div>
      </div>

      {showForm ? (
        <WalletForm
          key={`${wallet ? JSON.stringify(wallet) : 'new'}-${String(customizing)}`}
          walletRole="secondary"
          initial={wallet?.sameAsPrimary ? primary : wallet}
          {...(!wallet || customizing
            ? {
                onCancel: () => {
                  setAdding(false)
                  setCustomizing(false)
                },
              }
            : {})}
          onSaved={() => {
            setAdding(false)
            setCustomizing(false)
          }}
        />
      ) : sameAsPrimary ? (
        <Empty>Os dados desta carteira acompanham a carteira principal.</Empty>
      ) : (
        <Empty>Você ainda não adicionou uma carteira secundária.</Empty>
      )}
    </section>
  )
}
