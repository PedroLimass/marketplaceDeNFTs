import type { ReactNode } from 'react'

import { Button } from '@/shared/ui/button'

/** Mensagens do formulário como um todo. Erros são anunciados na hora; avisos, com calma. */
export function FormMessage({ tone, children }: { tone: 'error' | 'info'; children: ReactNode }) {
  if (!children) return null

  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        tone === 'error'
          ? 'text-[13px] leading-4 text-destructive'
          : 'text-[13px] leading-4 text-text-secondary'
      }
    >
      {children}
    </p>
  )
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="h-[60px] w-full rounded-[10px] bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90 md:h-[45px] md:rounded-[5px]"
    >
      {children}
    </Button>
  )
}
