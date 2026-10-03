import * as React from 'react'

import { cn } from '@/shared/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-[50px] w-full min-w-0 rounded-[10px] border border-border bg-transparent px-4 text-base text-foreground transition-colors outline-none placeholder:text-brand-secondary focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive md:h-10 md:rounded-[5px] md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
