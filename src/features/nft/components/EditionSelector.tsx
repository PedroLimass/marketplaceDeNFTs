import { RadioGroup } from 'radix-ui'

import type { NftEdition } from '@/features/catalog/types/catalog'
import { cn } from '@/shared/lib/utils'

interface EditionSelectorProps {
  editions: NftEdition[]
  value: string | undefined
  onChange: (editionId: string) => void
}

export function EditionSelector({ editions, value, onChange }: EditionSelectorProps) {
  const selected = editions.find((edition) => edition.id === value)

  return (
    <div className="flex flex-col gap-2">
      <p id="edicao-rotulo" className="text-sm leading-4 font-bold text-text-primary">
        Edição:
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <RadioGroup.Root
          aria-labelledby="edicao-rotulo"
          value={value ?? ''}
          onValueChange={onChange}
          className="flex flex-wrap gap-2"
        >
          {editions.map((edition) => {
            const soldOut = edition.available === 0
            return (
              <RadioGroup.Item
                key={edition.id}
                value={edition.id}
                disabled={soldOut}
                title={soldOut ? 'Edição esgotada' : `${String(edition.available)} disponíveis`}
                className={cn(
                  'h-7 min-w-9 cursor-pointer rounded-full border border-border-soft px-2.5 text-sm leading-4 text-foreground outline-none',
                  'hover:border-primary focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
                  'data-[state=checked]:border-primary data-[state=checked]:bg-primary/15 data-[state=checked]:font-bold data-[state=checked]:text-text-accent',
                  'disabled:cursor-not-allowed disabled:text-text-secondary disabled:line-through disabled:opacity-60',
                )}
              >
                {edition.label}
              </RadioGroup.Item>
            )
          })}
        </RadioGroup.Root>

        {selected ? (
          <span
            className={cn(
              'inline-flex h-7 items-center rounded-full bg-surface-raised px-3 text-xs font-bold',
              selected.status === 'open' ? 'text-text-accent' : 'text-text-coral',
            )}
          >
            {selected.status === 'open' ? 'ABERTA' : 'ESGOTADA'}
          </span>
        ) : null}
      </div>
    </div>
  )
}
