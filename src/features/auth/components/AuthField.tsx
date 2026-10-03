import { useId, useState, type ComponentProps } from 'react'

import eyeHideIcon from '@/shared/assets/icons/eye-hide.svg'
import { Input } from '@/shared/ui/input'

interface AuthFieldProps extends Omit<ComponentProps<typeof Input>, 'id'> {
  /** O design usa só placeholder; o rótulo existe para leitores de tela. */
  label: string
  error?: string | undefined
}

export function AuthField({ label, error, ...props }: AuthFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs leading-4 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function PasswordField({ label, error, ...props }: Omit<AuthFieldProps, 'type'>) {
  const id = useId()
  const errorId = `${id}-error`
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="pr-12"
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => {
            setVisible((current) => !current)
          }}
          className="absolute top-1/2 right-4 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <img
            src={eyeHideIcon}
            alt=""
            className={visible ? 'opacity-40' : undefined}
            width={19}
            height={15}
          />
        </button>
      </div>
      {error ? (
        <p id={errorId} className="text-xs leading-4 text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
