import { formatEth } from '@/shared/lib/money'

import type { Nft } from '../types/catalog'

const badgeLabels = { rare: 'RARO', limited: 'LIMITADO' } as const

interface NftCardProps {
  nft: Nft
  /** Cards da primeira fileira carregam já; os demais esperam a rolagem. */
  priority?: boolean
}

export function NftCard({ nft, priority = false }: NftCardProps) {
  return (
    <article className="flex flex-col gap-2 md:gap-3">
      <div className="relative overflow-hidden rounded-[20px] bg-linear-to-br from-surface-card from-12% to-surface-raised px-1 pt-3 pb-5 md:rounded-none md:bg-surface-card md:bg-none md:pt-6 md:pb-[26px]">
        <img
          src={nft.thumbnailUrl}
          alt=""
          width={500}
          height={500}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`aspect-square w-full rounded-2xl object-cover md:rounded-[15px] ${nft.status === 'sold_out' ? 'opacity-50' : ''}`}
        />
        {nft.badge ? (
          // No desktop o design não mostra selo nos cards; só o mobile mostra o "RARO".
          <span className="absolute top-4 left-0 bg-primary px-2 py-2 text-[13px] leading-4 font-medium text-ink md:hidden">
            {badgeLabels[nft.badge]}
          </span>
        ) : null}
        {nft.status === 'sold_out' ? (
          <span className="absolute right-3 bottom-3 rounded-sm bg-ink/85 px-2 py-1 text-xs font-bold text-text-coral md:right-2 md:bottom-3">
            ESGOTADO
          </span>
        ) : null}
      </div>

      <div className="flex flex-col pl-2 md:gap-3 md:pl-0">
        <h3 className="text-[15px] leading-[1.2] text-foreground md:text-base md:leading-4">
          {nft.name}
        </h3>
        <p className="flex items-center gap-3 text-base leading-4 font-bold text-text-accent md:text-lg">
          <span>{formatEth(nft.priceEth)}</span>
          {nft.previousPriceEth ? (
            <span className="font-normal text-brand-secondary">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.previousPriceEth)}
            </span>
          ) : null}
        </p>
      </div>
    </article>
  )
}
