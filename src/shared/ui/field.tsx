import { useId, type ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export interface FieldControlProps {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
  'aria-required'?: true
}

interface FieldProps {
  label: string
  required?: boolean
  error?: string | undefined
  hint?: string
  className?: string
  children: (control: FieldControlProps) => ReactNode
}

export function Field({ label, required, error, hint, className, children }: FieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  const control: FieldControlProps = {
    id,
    ...(error ? { 'aria-invalid': true as const } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(required ? { 'aria-required': true as const } : {}),
  }

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <label htmlFor={id} className="text-[13px] leading-[15px] font-bold text-text-primary">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-text-coral">
            *
          </span>
        ) : null}
      </label>
      {children(control)}
      {hint && !error ? (
        <p id={hintId} className="text-xs leading-4 text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs leading-4 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
