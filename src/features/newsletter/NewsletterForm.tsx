import { useId, useState, type SubmitEvent } from 'react'
import { z } from 'zod'

import { cn } from '@/shared/lib/utils'

const emailSchema = z.email().max(254)

type Feedback = { kind: 'error' | 'success'; message: string } | null

/**
 * Inscrição na newsletter. Não há backend para isso: o e-mail só é validado e a confirmação
 * é local, sem guardar nada.
 */
export function NewsletterForm() {
  const inputId = useId()
  const feedbackId = useId()
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState<Feedback>(null)

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = emailSchema.safeParse(email.trim())

    if (!parsed.success) {
      setFeedback({ kind: 'error', message: 'Informe um e-mail válido, como nome@exemplo.com.' })
      return
    }

    setEmail('')
    setFeedback({
      kind: 'success',
      message: `Inscrição confirmada! Enviaremos os próximos lançamentos para ${parsed.data}.`,
    })
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
      <label htmlFor={inputId} className="sr-only">
        E-mail para receber lançamentos
      </label>
      <div className="flex h-10 w-full items-center justify-between rounded-[6px] bg-surface-dark shadow-[0_0_10px_rgba(10,6,4,0.45)] focus-within:ring-2 focus-within:ring-primary">
        <input
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          maxLength={254}
          value={email}
          placeholder="digite seu e-mail..."
          aria-invalid={feedback?.kind === 'error'}
          aria-describedby={feedback ? feedbackId : undefined}
          onChange={(event) => {
            setEmail(event.target.value)
            if (feedback) setFeedback(null)
          }}
          className="h-full min-w-0 flex-1 bg-transparent pl-3 text-sm text-foreground outline-none placeholder:text-brand-secondary"
        />
        <button
          type="submit"
          className="h-10 w-[85px] shrink-0 cursor-pointer rounded-r-[6px] bg-primary pr-1 pl-4 text-lg font-bold text-ink outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-text-accent"
        >
          Enviar
        </button>
      </div>
      <p
        id={feedbackId}
        role={feedback?.kind === 'error' ? 'alert' : 'status'}
        className={cn(
          'text-xs leading-4',
          feedback?.kind === 'error' ? 'text-text-coral' : 'text-text-accent',
          !feedback && 'sr-only',
        )}
      >
        {feedback?.message}
      </p>
    </form>
  )
}
