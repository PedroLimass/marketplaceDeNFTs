import { Minus, Plus } from 'lucide-react'

import { Button } from '@/shared/ui/button'

interface QuantityStepperProps {
  quantity: number
  max: number
  onIncrement: () => void
  onDecrement: () => void
  disabled?: boolean
}

export function QuantityStepper({
  quantity,
  max,
  onIncrement,
  onDecrement,
  disabled = false,
}: QuantityStepperProps) {
  return (
    <div role="group" aria-label="Quantidade" className="flex items-center gap-3">
      <Button
        type="button"
        size="icon-sm"
        aria-label="Diminuir quantidade"
        className="rounded-full"
        disabled={disabled || quantity <= 1}
        onClick={onDecrement}
      >
        <Minus aria-hidden="true" />
      </Button>
      <span
        aria-live="polite"
        aria-atomic="true"
        className="min-w-6 text-center text-lg font-bold text-text-primary"
      >
        {quantity}
      </span>
      <Button
        type="button"
        size="icon-sm"
        aria-label="Aumentar quantidade"
        className="rounded-full"
        disabled={disabled || quantity >= max}
        onClick={onIncrement}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  )
}
