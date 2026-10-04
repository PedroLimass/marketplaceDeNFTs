import { useQueryClient } from '@tanstack/react-query'
import { useId, useState, type SubmitEvent } from 'react'

import { isApiError } from '@/infrastructure/http/errors'
import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'

import { createQuote } from '../api/cartApi'
import { couponStore } from '../coupon/couponStore'

interface CouponFormProps {
  appliedCode: string | undefined
  network: NetworkId
}

function describeCouponError(error: unknown): string {
  if (isApiError(error)) {
    return error.fieldErrors.coupon_code?.[0] ?? error.message
  }
  return 'Não foi possível validar o cupom. Tente novamente.'
}

/**
 * Valida o código com uma cotação antes de guardá-lo: um cupom inválido ou vencido mostra
 * o erro no campo e nunca chega a alterar os valores.
 */
export function CouponForm({ appliedCode, network }: CouponFormProps) {
  const queryClient = useQueryClient()
  const inputId = useId()
  const errorId = useId()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = code.trim().toUpperCase()
    if (!value) {
      setError('Digite o código promocional.')
      return
    }

    setChecking(true)
    setError(null)
    queryClient
      .query({
        queryKey: ['cart', 'coupon-check', value, network],
        queryFn: ({ signal }) => createQuote({ couponCode: value, network }, signal),
        staleTime: 0,
      })
      .then(() => {
        couponStore.set(value)
        setCode('')
        void queryClient.invalidateQueries({ queryKey: ['cart', 'quote'] })
        toast.success(`Cupom ${value} aplicado.`)
      })
      .catch((failure: unknown) => {
        setError(describeCouponError(failure))
      })
      .finally(() => {
        setChecking(false)
      })
  }

  if (appliedCode) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm leading-4 font-bold text-text-primary">Código promocional</p>
        <div className="flex h-10 items-center justify-between gap-3 rounded-md bg-surface-dark px-3 text-sm">
          <span className="font-bold text-text-accent">{appliedCode}</span>
          <Button
            type="button"
            variant="link"
            className="text-sm"
            onClick={() => {
              couponStore.clear()
              void queryClient.invalidateQueries({ queryKey: ['cart', 'quote'] })
              toast.info('Cupom removido.')
            }}
          >
            Remover <span className="sr-only">cupom {appliedCode}</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm leading-4 font-bold text-text-primary">
        Código promocional
      </label>
      <div className="flex h-10 items-center rounded-md bg-surface-dark focus-within:ring-2 focus-within:ring-primary md:h-10">
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
          value={code}
          placeholder="Digite o código promocional..."
          aria-invalid={error !== null}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setCode(event.target.value)
            if (error) setError(null)
          }}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-brand-secondary"
        />
        <Button
          type="submit"
          loading={checking}
          className="h-full min-w-[102px] rounded-l-none text-sm focus-visible:ring-inset focus-visible:ring-offset-0"
        >
          Aplicar
        </Button>
      </div>
      <p
        id={errorId}
        role={error ? 'alert' : undefined}
        className="min-h-4 text-xs leading-4 text-text-coral"
      >
        {error}
      </p>
    </form>
  )
}
