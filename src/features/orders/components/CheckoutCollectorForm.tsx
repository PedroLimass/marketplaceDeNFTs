import { Link } from '@tanstack/react-router'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'

import type { User } from '@/features/auth/types/auth'
import { networkLabels } from '@/features/catalog/constants'
import { networkIds } from '@/features/catalog/schemas/catalog.schemas'
import { walletTypeLabels } from '@/features/wallets/constants'
import { EnsNameInput } from '@/features/wallets/components/EnsNameInput'
import { walletTypes, type WalletType } from '@/features/wallets/schemas/wallet.schemas'
import type { Wallet } from '@/features/wallets/types/wallet'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'

export interface CollectorFormValues {
  display_name: string
  email: string
  note: string
}

interface CheckoutCollectorFormProps {
  user: User
  wallet: Wallet
  wallets: Wallet[]
  disabled?: boolean
  register: UseFormRegister<CollectorFormValues>
  errors: FieldErrors<CollectorFormValues>
  onSelectWallet: (walletId: string) => void
}

function walletByNetwork(wallets: Wallet[], network: string): Wallet | undefined {
  return wallets.find((candidate) => candidate.network === network)
}

function walletByType(wallets: Wallet[], type: WalletType): Wallet | undefined {
  return wallets.find((candidate) => candidate.type === type)
}

export function CheckoutCollectorForm({
  user,
  wallet,
  wallets,
  disabled,
  register,
  errors,
  onSelectWallet,
}: CheckoutCollectorFormProps) {
  const secondary = wallets.find((candidate) => candidate.role === 'secondary')
  const secondaryHint = secondary
    ? secondary.ensName
      ? `${secondary.ensName}.eth`
      : secondary.address
    : ''

  return (
    <section aria-labelledby="colecionador-titulo" className="flex flex-col gap-3">
      <h2 id="colecionador-titulo" className="text-[17px] leading-4 font-bold text-text-primary">
        Perfil do colecionador
      </h2>

      <div className="flex flex-col gap-6">
        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
          <Field label="Nome de exibição" required error={errors.display_name?.message}>
            {(control) => (
              <Input
                {...control}
                autoComplete="name"
                disabled={disabled}
                {...register('display_name')}
              />
            )}
          </Field>
          <Field label="Nome de usuário" required>
            {(control) => (
              <Input {...control} readOnly value={user.username} autoComplete="username" />
            )}
          </Field>

          <Field label="Rede" required>
            {(control) => (
              <Select
                {...control}
                value={wallet.network}
                disabled={disabled}
                onChange={(event) => {
                  const next = walletByNetwork(wallets, event.target.value)
                  if (next) onSelectWallet(next.id)
                }}
              >
                <option value="" disabled>
                  Selecione uma rede
                </option>
                {networkIds.map((id) => (
                  <option key={id} value={id} disabled={!walletByNetwork(wallets, id)}>
                    {networkLabels[id]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Nome do perfil" required>
            {(control) => (
              <Input {...control} readOnly value={user.displayName} autoComplete="nickname" />
            )}
          </Field>

          <Field label="Endereço da carteira" required>
            {(control) => (
              <Input
                {...control}
                readOnly
                value={wallet.address}
                placeholder="Endereço 0x da carteira"
              />
            )}
          </Field>
          <Field label="ENS ou carteira secundária (opcional)">
            {(control) => (
              <Input
                {...control}
                readOnly
                value={secondaryHint}
                placeholder="ENS ou carteira secundária (opcional)"
              />
            )}
          </Field>

          <Field label="Tipo de carteira" required>
            {(control) => (
              <Select
                {...control}
                value={wallet.type}
                disabled={disabled}
                onChange={(event) => {
                  const next = walletByType(wallets, event.target.value as WalletType)
                  if (next) onSelectWallet(next.id)
                }}
              >
                <option value="" disabled>
                  Selecione uma carteira
                </option>
                {walletTypes.map((type) => (
                  <option key={type} value={type} disabled={!walletByType(wallets, type)}>
                    {walletTypeLabels[type]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Código de indicação">
            {(control) => (
              <Input {...control} readOnly value="" autoComplete="off" aria-required={false} />
            )}
          </Field>

          <Field label="E-mail" required error={errors.email?.message}>
            {(control) => (
              <Input
                {...control}
                type="email"
                autoComplete="email"
                disabled={disabled}
                {...register('email')}
              />
            )}
          </Field>
          <Field label="Nome ENS" required>
            {(control) => (
              <EnsNameInput
                {...control}
                readOnly
                value={wallet.ensName ?? user.ensName ?? ''}
                placeholder=""
              />
            )}
          </Field>
        </div>

        <Link
          to="/profile/wallets"
          className="inline-flex items-center gap-2 rounded-sm text-[15px] text-foreground outline-none hover:text-text-accent focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span aria-hidden="true" className="size-[15px] rounded-full border border-foreground" />
          Usar outra carteira?
        </Link>

        <Field label="Observação do colecionador (opcional)" error={errors.note?.message}>
          {(control) => (
            <textarea
              {...control}
              rows={6}
              maxLength={280}
              disabled={disabled}
              className="h-[152px] w-full max-w-[350px] resize-y rounded-[3px] border border-border bg-transparent px-3 py-3 text-sm text-foreground outline-none placeholder:text-brand-secondary focus-visible:border-primary aria-invalid:border-destructive"
              {...register('note')}
            />
          )}
        </Field>
      </div>
    </section>
  )
}
