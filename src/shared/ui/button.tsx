import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { Slot } from 'radix-ui'

import { cn } from '@/shared/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[6px] font-bold whitespace-nowrap select-none',
    'transition-colors duration-150 outline-none',
    'focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
    'motion-safe:active:translate-y-px',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-text-accent active:bg-primary disabled:hover:bg-primary',
        outline:
          'border border-border-soft bg-transparent font-medium text-text-secondary hover:bg-surface-raised hover:text-foreground',
        ghost: 'bg-transparent font-medium text-foreground hover:bg-surface-raised',
        link: 'h-auto rounded-sm p-0 font-normal text-text-accent underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-10 px-3 text-sm md:h-9',
        default: 'h-10 px-5 text-base',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-10 md:size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={disabled === true || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" /> : null}
      {children}
    </button>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
