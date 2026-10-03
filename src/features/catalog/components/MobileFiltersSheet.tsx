import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useState } from 'react'

import { Button } from '@/shared/ui/button'

import filterIcon from '../assets/filter.svg'
import { sortLabels } from '../constants'
import type { FiltersPatch } from '../hooks/useCatalogFilters'
import { isSortOption, sortOptions } from '../schemas/catalog.schemas'
import type { CatalogFacets, CatalogFilters } from '../types/catalog'
import { FiltersPanel } from './FiltersPanel'

interface MobileFiltersSheetProps {
  filters: CatalogFilters
  facets: CatalogFacets | undefined
  failed: boolean
  total: number | undefined
  activeCount: number
  onChange: (patch: FiltersPatch) => void
  onClear: () => void
}

/** No celular os filtros e a ordenação ficam numa folha que sobe de baixo (o design só traz o botão). */
export function MobileFiltersSheet({
  filters,
  facets,
  failed,
  total,
  activeCount,
  onChange,
  onClear,
}: MobileFiltersSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label={activeCount > 0 ? `Filtros (${String(activeCount)} ativos)` : 'Filtros'}
        className="relative flex size-[45px] shrink-0 items-center justify-center rounded-[14px] bg-linear-[137deg] from-primary/45 from-25% to-primary outline-none focus-visible:ring-2 focus-visible:ring-text-accent"
      >
        <img src={filterIcon} alt="" width={16} height={16} />
        {activeCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-ink text-[10px] leading-none font-medium text-text-accent"
          >
            {activeCount}
          </span>
        ) : null}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-2xl border-t border-border bg-ink outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <Dialog.Title className="text-lg font-bold text-foreground">Filtros</Dialog.Title>
            <Dialog.Close
              aria-label="Fechar filtros"
              className="flex size-9 items-center justify-center rounded-md text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Escolha coleções, faixa de preço, rede e a ordem da listagem.
          </Dialog.Description>

          <div className="flex flex-col gap-6 overflow-y-auto px-5 pb-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-lg leading-4 font-bold text-foreground">
                Ordenar por
              </legend>
              {sortOptions.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-3 px-3 text-[15px] leading-10 text-text-secondary has-checked:text-text-accent"
                >
                  <input
                    type="radio"
                    name="sort"
                    value={option}
                    checked={filters.sort === option}
                    onChange={(event) => {
                      if (isSortOption(event.target.value)) onChange({ sort: event.target.value })
                    }}
                    className="size-4 accent-primary"
                  />
                  {sortLabels[option]}
                </label>
              ))}
            </fieldset>

            <FiltersPanel
              filters={filters}
              facets={facets}
              failed={failed}
              onChange={onChange}
              className="p-0"
            />
          </div>

          <div className="flex gap-3 border-t border-border px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClear}
              disabled={activeCount === 0}
              size="lg"
              className="flex-1"
            >
              Limpar
            </Button>
            <Dialog.Close asChild>
              <Button type="button" size="lg" className="flex-[2]">
                {total === undefined ? 'Ver resultados' : `Ver ${String(total)} resultados`}
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
