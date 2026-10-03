import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { applyApiError } from '@/shared/lib/forms/applyApiError'

import { useRegister } from '../hooks/useAuthMutations'
import { registerFormSchema, type RegisterFormValues } from '../schemas/auth.schemas'
import { AuthField, PasswordField } from './AuthField'
import { FormMessage, SubmitButton } from './AuthFormParts'
import { SocialSignIn } from './SocialSignIn'

const UNAVAILABLE_NOTICE = 'Indisponível nesta demonstração. Crie a conta com e-mail e senha.'

export function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const registerAccount = useRegister()
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async ({ username, email, password }) => {
    setFormError(null)
    setNotice(null)

    try {
      await registerAccount.mutateAsync({ username, email, password })
      onSuccess()
    } catch (error) {
      setFormError(applyApiError(error, setError, ['username', 'email', 'password']))
    }
  })

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void onSubmit(event)
      }}
      className="flex flex-col gap-10 md:gap-0"
    >
      <div className="flex flex-col gap-3 md:px-20 md:pt-6">
        <AuthField
          label="Nome de usuário"
          autoComplete="username"
          placeholder="Nome de usuário"
          error={errors.username?.message}
          {...register('username')}
        />
        <AuthField
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Senha"
          autoComplete="new-password"
          placeholder="Senha"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordField
          label="Confirmar senha"
          autoComplete="new-password"
          placeholder="Confirmar senha"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <FormMessage tone="error">{formError}</FormMessage>
        <FormMessage tone="info">{notice}</FormMessage>
      </div>

      <div className="md:px-20 md:pt-6">
        <SubmitButton pending={registerAccount.isPending}>
          {registerAccount.isPending ? 'Criando conta…' : 'Criar conta'}
        </SubmitButton>
      </div>

      <div className="md:pt-6">
        <SocialSignIn
          onSelect={() => {
            setNotice(UNAVAILABLE_NOTICE)
          }}
        />
      </div>
    </form>
  )
}
