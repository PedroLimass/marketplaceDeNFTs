import { Tabs } from 'radix-ui'

import arrowDown from '@/shared/assets/icons/arrow-down.svg'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

import { listingLabels, sortLabels } from '../constants'
import {
  isSortOption,
  listingFilters,
  sortOptions,
  type SortOption,
} from '../schemas/catalog.schemas'

interface CatalogToolbarProps {
  sort: SortOption
  onSortChange: (sort: SortOption) => void
}

const tabClass =
  'relative cursor-pointer pb-1 text-sm leading-4 whitespace-nowrap text-foreground outline-none after:absolute after:inset-x-0 after:bottom-0 after:hidden after:h-0.5 after:bg-primary after:content-[""] focus-visible:ring-2 focus-visible:ring-primary data-[state=active]:font-bold data-[state=active]:text-text-accent data-[state=active]:after:block md:pb-[7px] md:text-[15px] md:font-medium md:data-[state=active]:font-medium'

/** Abas e ordenação. Precisa estar dentro de `Tabs.Root` (ver `CatalogSection`). */
export function CatalogToolbar({ sort, onSortChange }: CatalogToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Tabs.List aria-label="Listagem" className="flex gap-4 overflow-x-auto md:gap-5">
        {listingFilters.map((value) => (
          <Tabs.Trigger key={value} value={value} className={tabClass}>
            {listingLabels[value]}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <DropdownMenu>
        <DropdownMenuTrigger className="hidden items-center gap-2 rounded-sm text-[15px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex">
          <span>Ordenar por:</span>
          <span className="ml-1">{sortLabels[sort]}</span>
          <img src={arrowDown} alt="" width={11} height={6} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={sort}
            onValueChange={(value) => {
              if (isSortOption(value)) onSortChange(value)
            }}
          >
            {sortOptions.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {sortLabels[option]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
