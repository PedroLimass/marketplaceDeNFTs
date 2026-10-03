import { CATALOG_PAGE_SIZE } from '../constants'
import type { Nft } from '../types/catalog'
import { NftCard } from './NftCard'
import { NftCardSkeleton } from './NftCardSkeleton'

/**
 * Duas colunas escalonadas no celular (a coluna da direita desce 32 px, como no design),
 * três a partir do tablet. No desktop largo as colunas têm a largura fixa de 258 px do design.
 */
const gridClass =
  'grid grid-cols-2 gap-x-3.5 gap-y-6 pb-8 md:grid-cols-3 md:gap-x-6 md:gap-y-[72px] md:pb-0 xl:grid-cols-[repeat(3,258px)] xl:justify-between [&>li:nth-child(even)]:translate-y-8 md:[&>li:nth-child(even)]:translate-y-0'

export function NftGrid({ items, busy }: { items: Nft[]; busy: boolean }) {
  return (
    <ul
      aria-busy={busy}
      className={`${gridClass} transition-opacity ${busy ? 'opacity-60' : 'opacity-100'}`}
    >
      {items.map((nft, index) => (
        <li key={nft.id}>
          <NftCard nft={nft} priority={index < 3} />
        </li>
      ))}
    </ul>
  )
}

export function NftGridSkeleton() {
  return (
    <ul aria-hidden="true" className={gridClass}>
      {Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => (
        <li key={index}>
          <NftCardSkeleton />
        </li>
      ))}
    </ul>
  )
}
