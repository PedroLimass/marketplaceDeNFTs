import { useState } from 'react'

import { CatalogSearchField } from '@/features/catalog/components/CatalogSearchField'
import searchIcon from '@/shared/assets/icons/search.svg'

/** Ícone de busca que se expande em campo; só no desktop (no celular a busca fica na Home). */
export function HeaderSearch() {
  const [open, setOpen] = useState(false)

  if (open) {
    return (
      <CatalogSearchField
        variant="header"
        focusOnMount
        className="hidden w-56 md:flex"
        onEscape={() => {
          setOpen(false)
        }}
      />
    )
  }

  return (
    <button
      type="button"
      aria-label="Buscar NFTs"
      onClick={() => {
        setOpen(true)
      }}
      className="hidden size-[35px] items-center justify-center rounded-md outline-none hover:bg-surface-card focus-visible:ring-2 focus-visible:ring-primary md:flex"
    >
      <img src={searchIcon} alt="" width={16} height={16} className="size-4" />
    </button>
  )
}
