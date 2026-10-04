import { Star } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export function RatingStars({ average, className }: { average: number; className?: string }) {
  const filled = Math.round(average)

  return (
    <span
      role="img"
      aria-label={`Nota ${average.toFixed(1)} de 5`}
      className={cn('flex items-center gap-1', className)}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            'size-[15px]',
            index < filled ? 'fill-primary text-primary' : 'text-border-soft',
          )}
        />
      ))}
    </span>
  )
}
