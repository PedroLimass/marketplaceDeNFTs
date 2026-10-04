import { Slider as SliderPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'

interface RangeSliderProps extends Omit<ComponentProps<typeof SliderPrimitive.Root>, 'value'> {
  value: number[]
  thumbLabels: string[]
}

export function RangeSlider({ className, value, thumbLabels, ...props }: RangeSliderProps) {
  return (
    <SliderPrimitive.Root
      value={value}
      className={cn('relative flex h-[15px] w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-border-soft">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      {value.map((_, index) => (
        <SliderPrimitive.Thumb
          key={thumbLabels[index] ?? index}
          aria-label={thumbLabels[index]}
          className="block size-[15px] rounded-full bg-primary shadow-[0_0_0_3px_var(--ink)] outline-none focus-visible:shadow-[0_0_0_3px_var(--ink),0_0_0_5px_var(--text-accent)]"
        />
      ))}
    </SliderPrimitive.Root>
  )
}
