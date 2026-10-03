import { useState } from 'react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { RangeSlider } from '@/shared/ui/slider'

import type { FiltersPatch } from '../hooks/useCatalogFilters'
import { isNetworkId } from '../schemas/catalog.schemas'
import type { CatalogFacets, CatalogFilters, FacetEntry } from '../types/catalog'
import {
  ethToCenti,
  formatPriceRangeLabel,
  fromPriceSelection,
  centiToEth,
  toPriceSelection,
} from '../utils/priceRange'

interface FiltersPanelProps {
  filters: CatalogFilters
  /** `undefined` enquanto a primeira resposta não chega (ou se ela falhou). */
  facets: CatalogFacets | undefined
  failed: boolean
  onChange: (patch: FiltersPatch) => void
  className?: string
}

const headingClass = 'text-lg leading-4 font-bold text-foreground'

function toggle<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function FacetRows({
  entries,
  selected,
  onToggle,
}: {
  entries: FacetEntry[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <ul className="flex flex-col px-3">
      {entries.map((entry) => {
        const active = selected.includes(entry.id)

        return (
          <li key={entry.id}>
            <button
              type="button"
              aria-pressed={active}
              disabled={entry.count === 0 && !active}
              onClick={() => {
                onToggle(entry.id)
              }}
              className={cn(
                'flex w-full cursor-pointer items-start justify-between rounded-sm text-left text-[15px] leading-10 outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40',
                active ? 'text-text-accent' : 'text-text-secondary hover:text-foreground',
              )}
            >
              <span className={active ? 'font-medium' : 'font-normal'}>{entry.name}</span>
              <span className="font-bold">({entry.count})</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function RowsSkeleton({ rows }: { rows: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 px-3 py-2">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
    </div>
  )
}

function PriceFilter({
  bounds,
  minPrice,
  maxPrice,
  onApply,
}: {
  bounds: { minEth: string; maxEth: string }
  minPrice: string | undefined
  maxPrice: string | undefined
  onApply: (selection: { min: string | undefined; max: string | undefined }) => void
}) {
  const [draft, setDraft] = useState<number[]>(() =>
    fromPriceSelection({ min: minPrice, max: maxPrice }, bounds),
  )
  const [low = 0, high = 0] = draft

  // Sem intervalo (catálogo vazio ou todos com o mesmo preço) não há o que ajustar.
  if (ethToCenti(bounds.maxEth) <= ethToCenti(bounds.minEth)) {
    return (
      <p className="px-3 text-sm text-text-secondary">
        {formatPriceRangeLabel(bounds.minEth, bounds.maxEth)}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 pl-3">
      <RangeSlider
        min={ethToCenti(bounds.minEth)}
        max={ethToCenti(bounds.maxEth)}
        step={1}
        minStepsBetweenThumbs={1}
        value={draft}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        onValueChange={setDraft}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] text-foreground">
          {formatPriceRangeLabel(centiToEth(low), centiToEth(high))}
        </p>
        <Button
          type="button"
          onClick={() => {
            onApply(toPriceSelection(draft, bounds))
          }}
          className="h-auto rounded-[6px] px-3 py-2 text-base leading-5 font-bold"
        >
          Aplicar
        </Button>
      </div>
    </div>
  )
}

export function FiltersPanel({ filters, facets, failed, onChange, className }: FiltersPanelProps) {
  return (
    <div className={cn('flex flex-col gap-10 bg-surface-card p-5', className)}>
      <section aria-labelledby="filtro-colecoes" className="flex flex-col gap-3">
        <h3 id="filtro-colecoes" className={headingClass}>
          Coleções
        </h3>
        {facets ? (
          <FacetRows
            entries={facets.categories}
            selected={filters.categories}
            onToggle={(id) => {
              onChange({ categories: toggle(filters.categories, id) })
            }}
          />
        ) : failed ? (
          <p className="px-3 text-sm text-text-secondary">Indisponível no momento.</p>
        ) : (
          <RowsSkeleton rows={9} />
        )}
      </section>

      <section aria-labelledby="filtro-preco" className="flex flex-col gap-3">
        <h3 id="filtro-preco" className={headingClass}>
          Faixa de preço
        </h3>
        {facets ? (
          <PriceFilter
            // Recria o rascunho quando o filtro aplicado (ou o intervalo) muda por fora.
            key={`${filters.minPrice ?? ''}|${filters.maxPrice ?? ''}|${facets.priceRange.minEth}|${facets.priceRange.maxEth}`}
            bounds={facets.priceRange}
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            onApply={({ min, max }) => {
              onChange({ minPrice: min, maxPrice: max })
            }}
          />
        ) : failed ? (
          <p className="px-3 text-sm text-text-secondary">Indisponível no momento.</p>
        ) : (
          <RowsSkeleton rows={2} />
        )}
      </section>

      <section aria-labelledby="filtro-rede" className="flex flex-col gap-3">
        <h3 id="filtro-rede" className={headingClass}>
          Rede
        </h3>
        {facets ? (
          <FacetRows
            entries={facets.networks}
            selected={filters.networks}
            onToggle={(id) => {
              if (isNetworkId(id)) onChange({ networks: toggle(filters.networks, id) })
            }}
          />
        ) : failed ? (
          <p className="px-3 text-sm text-text-secondary">Indisponível no momento.</p>
        ) : (
          <RowsSkeleton rows={3} />
        )}
      </section>
    </div>
  )
}
