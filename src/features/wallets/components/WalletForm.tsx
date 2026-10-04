import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { FormMessage } from '@/features/auth/components/AuthFormParts'
import { networkIds } from '@/features/catalog/schemas/catalog.schemas'
import { networkLabels } from '@/features/catalog/constants'
import { applyMappedApiError } from '@/shared/lib/forms/applyApiError'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'

import { walletTypeLabels } from '../constants'
import { useSaveWallet } from '../hooks/useWallets'
import {
  ensLabelSchema,
  walletAddressSchema,
  walletNicknameSchema,
  walletTypeSchema,
  walletTypes,
  type WalletRole,
} from '../schemas/wallet.schemas'
import type { Wallet } from '../types/wallet'
import { EnsNameInput } from './EnsNameInput'

const walletFormSchema = z.object({
  network: z.string().min(1, 'Selecione uma rede.').pipe(z.enum(networkIds, 'Rede inválida.')),
  type: z.string().min(1, 'Selecione uma carteira.').pipe(walletTypeSchema),
  address: walletAddressSchema,
  nickname: walletNicknameSchema,
  ensName: ensLabelSchema,
})

type FormInput = z.input<typeof walletFormSchema>
type FormOutput = z.output<typeof walletFormSchema>

const API_FIELDS = {
  network: 'network',
  type: 'type',
  address: 'address',
  nickname: 'nickname',
  ens_name: 'ensName',
} as const

const roleLabels: Record<WalletRole, string> = {
  primary: 'Carteira principal',
  secondary: 'Carteira secundária',
}

interface WalletFormProps {
  walletRole: WalletRole
  /** Valores iniciais: a carteira já salva ou, ao personalizar a secundária, os da principal. */
  initial?: Wallet | undefined
  onCancel?: () => void
  onSaved?: () => void
}

export function WalletForm({ walletRole: role, initial, onCancel, onSaved }: WalletFormProps) {
  const save = useSaveWallet()
  const [formError, setFormError] = useState<string | null>(null)
  const roleLabel = roleLabels[role]

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      network: initial?.network ?? '',
      type: initial?.type ?? '',
      address: initial?.address ?? '',
      nickname: initial?.nickname ?? '',
      ensName: initial?.ensName ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    try {
      await save.mutateAsync({
        role,
        input: {
          type: values.type,
          network: values.network,
          address: values.address,
          nickname: values.nickname,
          ens_name: values.ensName,
        },
      })
    } catch (error) {
      setFormError(applyMappedApiError(error, setError, API_FIELDS))
      return
    }

    toast.success(`${roleLabel} salva.`)
    onSaved?.()
  })

  return (
    <form
      noValidate
      aria-label={roleLabel}
      onSubmit={(event) => {
        void onSubmit(event)
      }}
      className="flex flex-col gap-6"
    >
      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        <Field label="Rede" required error={errors.network?.message}>
          {(control) => (
            <Select defaultValue="" {...control} {...register('network')}>
              <option value="" disabled>
                Selecione uma rede
              </option>
              {networkIds.map((id) => (
                <option key={id} value={id}>
                  {networkLabels[id]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Tipo de carteira" required error={errors.type?.message}>
          {(control) => (
            <Select defaultValue="" {...control} {...register('type')}>
              <option value="" disabled>
                Selecione uma carteira
              </option>
              {walletTypes.map((type) => (
                <option key={type} value={type}>
                  {walletTypeLabels[type]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Endereço da carteira" required error={errors.address?.message}>
          {(control) => (
            <Input
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="none"
              placeholder="Endereço 0x da carteira"
              {...control}
              {...register('address')}
            />
          )}
        </Field>
        <Field label="Apelido da carteira" required error={errors.nickname?.message}>
          {(control) => <Input autoComplete="off" {...control} {...register('nickname')} />}
        </Field>
        <Field label="Nome ENS" error={errors.ensName?.message}>
          {(control) => <EnsNameInput {...control} {...register('ensName')} />}
        </Field>
      </div>

      <FormMessage tone="error">{formError}</FormMessage>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" className="w-full md:w-auto" loading={isSubmitting}>
          Salvar carteira
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full md:w-auto"
            onClick={onCancel}
          >
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
