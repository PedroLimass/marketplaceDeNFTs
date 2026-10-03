import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'

/** Placeholder de carregamento. Decorativo: o estado de carga é anunciado por quem o usa. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div aria-hidden="true" className={cn('skeleton rounded-md', className)} {...props} />
}
