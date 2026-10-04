import { useId, useState, type SubmitEvent } from 'react'
import { z } from 'zod'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

const emailSchema = z.email().max(254)

type Feedback = { kind: 'error' | 'success'; message: string } | null

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
        <Button
          type="submit"
          className="h-full min-w-[85px] rounded-l-none px-4 text-lg focus-visible:ring-inset focus-visible:ring-offset-0"
        >
          Enviar
        </Button>
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
