import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { applyApiError } from '@/shared/lib/forms/applyApiError'

import { useLogin } from '../hooks/useAuthMutations'
import { loginRequestSchema, type LoginRequest } from '../schemas/auth.schemas'
import { AuthField, PasswordField } from './AuthField'
import { FormMessage, SubmitButton } from './AuthFormParts'
import { SocialSignIn } from './SocialSignIn'

const UNAVAILABLE_NOTICE = 'Indisponível nesta demonstração. Entre com e-mail e senha.'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setNotice(null)

    try {
      await login.mutateAsync(values)
      onSuccess()
    } catch (error) {
      setFormError(applyApiError(error, setError, ['email', 'password']))
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
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Senha"
          autoComplete="current-password"
          placeholder="Senha"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-sm text-sm leading-4 text-text-accent outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onClick={() => {
              setNotice(UNAVAILABLE_NOTICE)
            }}
          >
            Esqueceu a senha?
          </button>
        </div>
        <FormMessage tone="error">{formError}</FormMessage>
        <FormMessage tone="info">{notice}</FormMessage>
      </div>

      <div className="md:px-20 md:pt-6">
        <SubmitButton pending={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar'}
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
