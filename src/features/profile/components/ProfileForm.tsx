import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { emailSchema, passwordSchema, usernameSchema } from '@/features/auth/schemas/auth.schemas'
import { FormMessage } from '@/features/auth/components/AuthFormParts'
import { EnsNameInput } from '@/features/wallets/components/EnsNameInput'
import { ensLabelSchema } from '@/features/wallets/schemas/wallet.schemas'
import { isApiError } from '@/infrastructure/http/errors'
import { applyMappedApiError } from '@/shared/lib/forms/applyApiError'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'
import { Field } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { PasswordInput } from '@/shared/ui/password-input'

import { useChangePassword, useUpdateProfile } from '../hooks/useProfile'
import { displayNameSchema } from '../schemas/profile.schemas'
import type { Profile } from '../types/profile'
import { AvatarField } from './AvatarField'

const optionalNickname = z
  .string()
  .trim()
  .max(24, 'O apelido deve ter no máximo 24 caracteres.')
  .transform((value) => (value === '' ? null : value))

const profileFormSchema = z
  .object({
    displayName: displayNameSchema,
    username: usernameSchema,
    email: emailSchema,
    ensName: ensLabelSchema,
    walletNickname: optionalNickname,
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    const touched = [values.currentPassword, values.newPassword, values.confirmPassword].some(
      (value) => value !== '',
    )
    if (!touched) return

    if (values.currentPassword === '') {
      context.addIssue({
        code: 'custom',
        path: ['currentPassword'],
        message: 'Informe a senha atual.',
      })
    }

    const strength = passwordSchema.safeParse(values.newPassword)
    if (!strength.success) {
      context.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message:
          values.newPassword === ''
            ? 'Informe a nova senha.'
            : (strength.error.issues[0]?.message ?? 'Senha inválida.'),
      })
    } else if (values.newPassword === values.currentPassword) {
      context.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'A nova senha deve ser diferente da atual.',
      })
    }

    if (values.confirmPassword !== values.newPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message:
          values.confirmPassword === '' ? 'Confirme a nova senha.' : 'As senhas não coincidem.',
      })
    }
  })

type FormInput = z.input<typeof profileFormSchema>
type FormOutput = z.output<typeof profileFormSchema>

const API_FIELDS = {
  display_name: 'displayName',
  username: 'username',
  email: 'email',
  ens_name: 'ensName',
  wallet_nickname: 'walletNickname',
} as const

const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' }

const toDefaults = (profile: Profile): FormInput => ({
  displayName: profile.displayName,
  username: profile.username,
  email: profile.email,
  ensName: profile.ensName ?? '',
  walletNickname: profile.walletNickname ?? '',
  ...emptyPasswords,
})

export function ProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: toDefaults(profile),
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)

    const profileChanged = (
      ['displayName', 'username', 'email', 'ensName', 'walletNickname'] as const
    ).some((field) => dirtyFields[field])
    const passwordChanged = values.newPassword !== ''

    if (!profileChanged && !passwordChanged) {
      toast.info('Nenhuma alteração para salvar.')
      return
    }

    let saved = profile
    if (profileChanged) {
      try {
        saved = await updateProfile.mutateAsync({
          display_name: values.displayName,
          username: values.username,
          email: values.email,
          ens_name: values.ensName,
          wallet_nickname: values.walletNickname,
        })
      } catch (error) {
        setFormError(applyMappedApiError(error, setError, API_FIELDS))
        return
      }
    }

    if (passwordChanged) {
      try {
        await changePassword.mutateAsync({
          current_password: values.currentPassword,
          new_password: values.newPassword,
        })
      } catch (error) {
        // Os dados do perfil já foram salvos; só a senha falhou e o formulário reflete isso.
        reset({ ...toDefaults(saved), ...emptyPasswords }, { keepErrors: false })
        if (isApiError(error) && error.code === 'invalid_current_password') {
          setError('currentPassword', { type: 'server', message: 'A senha atual está incorreta.' })
          setFormError(
            profileChanged ? 'Os dados foram salvos, mas a senha não foi alterada.' : null,
          )
        } else {
          setFormError(
            isApiError(error)
              ? error.message
              : 'Não foi possível alterar a senha. Tente novamente.',
          )
        }
        return
      }
    }

    reset(toDefaults(saved))
    toast.success(
      passwordChanged && profileChanged
        ? 'Perfil e senha atualizados.'
        : passwordChanged
          ? 'Senha alterada.'
          : 'Perfil atualizado.',
    )
  })

  return (
    <form
      noValidate
      aria-labelledby="perfil-titulo"
      onSubmit={(event) => {
        void onSubmit(event)
      }}
      className="flex flex-col gap-10"
    >
      <h1 id="perfil-titulo" className="text-base leading-4 font-bold text-text-primary">
        Perfil do colecionador
      </h1>

      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        <Field label="Nome de exibição" required error={errors.displayName?.message}>
          {(control) => <Input autoComplete="name" {...control} {...register('displayName')} />}
        </Field>
        <Field label="Nome de usuário" required error={errors.username?.message}>
          {(control) => (
            <Input
              autoComplete="username"
              autoCapitalize="none"
              {...control}
              {...register('username')}
            />
          )}
        </Field>
        <Field label="E-mail" required error={errors.email?.message}>
          {(control) => (
            <Input type="email" autoComplete="email" {...control} {...register('email')} />
          )}
        </Field>
        <Field label="Nome ENS" error={errors.ensName?.message}>
          {(control) => <EnsNameInput {...control} {...register('ensName')} />}
        </Field>
        <Field label="Apelido da carteira" error={errors.walletNickname?.message}>
          {(control) => <Input autoComplete="off" {...control} {...register('walletNickname')} />}
        </Field>
        <AvatarField avatarUrl={profile.avatarUrl} />
      </div>

      <fieldset className="flex flex-col gap-6">
        <legend className="mb-6 text-base leading-4 font-bold text-text-primary">
          Alterar senha
        </legend>
        <div className="grid gap-6 md:max-w-[417px]">
          <Field label="Senha atual" error={errors.currentPassword?.message}>
            {(control) => (
              <PasswordInput
                autoComplete="current-password"
                {...control}
                {...register('currentPassword')}
              />
            )}
          </Field>
          <Field
            label="Nova senha"
            hint="Mínimo de 8 caracteres, com letras e números."
            error={errors.newPassword?.message}
          >
            {(control) => (
              <PasswordInput
                autoComplete="new-password"
                {...control}
                {...register('newPassword')}
              />
            )}
          </Field>
          <Field label="Confirmar nova senha" error={errors.confirmPassword?.message}>
            {(control) => (
              <PasswordInput
                autoComplete="new-password"
                {...control}
                {...register('confirmPassword')}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        <FormMessage tone="error">{formError}</FormMessage>
        <Button type="submit" size="lg" className="w-full md:w-[131px]" loading={isSubmitting}>
          Salvar
        </Button>
      </div>
    </form>
  )
}
