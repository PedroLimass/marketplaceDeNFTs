import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'

/**
 * `<select>` nativo com a aparência dos campos de texto. Em celulares abre o seletor do
 * sistema, que é mais confiável do que um menu desenhado à mão.
 */
export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          'h-[50px] w-full min-w-0 cursor-pointer appearance-none rounded-[10px] border border-border bg-transparent pr-10 pl-4 text-base text-foreground transition-colors outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:h-10 md:rounded-[5px] md:text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-text-secondary"
      />
    </div>
  )
}
