import type { ReactNode } from 'react'

import { Button } from '@/shared/ui/button'

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
    <Button type="submit" size="lg" loading={pending} className="w-full">
      {children}
    </Button>
  )
}
