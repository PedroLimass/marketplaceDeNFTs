import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { ChevronLeft, Star } from 'lucide-react'

import type { NftDetail } from '@/features/catalog/types/catalog'
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { useMediaQuery, DESKTOP_QUERY } from '@/shared/hooks/useMediaQuery'
import { formatEth, mulEthByInt } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'

import { usePurchaseSelection } from '../hooks/usePurchaseSelection'
import { EditionSelector } from './EditionSelector'
import { NftGallery } from './NftGallery'
import { NftInfoTabs } from './NftInfoTabs'
import { DesktopPurchaseActions, MobileBuyBar } from './PurchasePanel'
import { RatingStars } from './RatingStars'
import { RelatedNfts } from './RelatedNfts'
import { ShareLinks } from './ShareLinks'

function TokenInfo({ nft }: { nft: NftDetail }) {
  return (
    <dl className="flex flex-col gap-3 text-sm leading-5 text-text-secondary">
      <div className="flex gap-1">
        <dt className="font-bold text-text-primary">ID do token:</dt>
        <dd>#{nft.tokenId}</dd>
      </div>
      <div className="flex gap-1">
        <dt className="font-bold text-text-primary">Coleção:</dt>
        <dd>{nft.collection.name}</dd>
      </div>
      <div className="flex gap-1">
        <dt className="shrink-0 font-bold text-text-primary">Atributos:</dt>
        <dd>{nft.attributes.join(', ')}</dd>
      </div>
    </dl>
  )
}

function Price({ nft, className }: { nft: NftDetail; className?: string }) {
  return (
    <p className={className}>
      <span className="font-bold text-text-accent">{formatEth(nft.priceEth)}</span>
      {nft.previousPriceEth ? (
        <span className="ml-3 font-normal text-brand-secondary">
          <span className="sr-only">Preço anterior: </span>
          {formatEth(nft.previousPriceEth)}
        </span>
      ) : null}
    </p>
  )
}

function DesktopDetail({ nft }: { nft: NftDetail }) {
  const selection = usePurchaseSelection(nft)

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-4 pt-8 pb-24 md:px-8 xl:px-0">
      <div className="flex flex-col gap-7">
        <nav aria-label="Trilha de navegação">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <li>
              <Link
                to="/"
                className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
              >
                Início
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li title="Indisponível nesta demonstração">Mercado</li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              {nft.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-[573px_minmax(0,1fr)]">
          <NftGallery
            images={nft.gallery}
            name={nft.name}
            navigation="rail"
            className="w-full max-w-[573px]"
          />

          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-4 border-b border-border-soft pb-4">
              <h1 className="text-[28px] leading-[1.3] font-bold text-text-primary">{nft.name}</h1>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <Price nft={nft} className="text-lg" />
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <RatingStars average={nft.rating.average} />
                  <span>{nft.rating.count} avaliações de colecionadores</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-sm leading-4 font-bold text-text-primary">Sobre este NFT:</h2>
              <p className="text-sm leading-6 text-text-secondary">{nft.description}</p>
            </div>

            <EditionSelector
              editions={nft.editions}
              value={selection.edition?.id}
              onChange={selection.selectEdition}
            />
            <DesktopPurchaseActions nft={nft} selection={selection} />
            <TokenInfo nft={nft} />
            <ShareLinks title={nft.name} url={window.location.href} />
          </div>
        </div>
      </div>

      <NftInfoTabs nft={nft} />
      <RelatedNfts nft={nft} />
    </div>
  )
}

function MobileDetail({ nft }: { nft: NftDetail }) {
  const selection = usePurchaseSelection(nft)
  const router = useRouter()
  const canGoBack = useCanGoBack()

  const total = formatEth(mulEthByInt(nft.priceEth, selection.quantity))

  return (
    <div className="flex flex-col">
      <div className="bg-linear-to-b from-surface-card to-ink px-7 pt-6 pb-12">
        <div className="mb-4 flex items-center justify-between">
          {canGoBack ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Voltar"
              className="rounded-full"
              onClick={() => {
                router.history.back()
              }}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </Button>
          ) : (
            <Link
              to="/"
              aria-label="Voltar ao início"
              className="flex size-10 items-center justify-center rounded-full border border-border-soft text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </Link>
          )}
          <FavoriteButton nftId={nft.id} nftName={nft.name} variant="icon" />
        </div>
        <NftGallery images={nft.gallery} name={nft.name} navigation="dots" />
      </div>

      <div className="-mt-6 flex flex-col gap-5 rounded-t-[28px] bg-surface-card px-6 pt-8 pb-8">
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-lg leading-6 font-bold text-text-primary">{nft.name}</h1>
          <p
            aria-label={`Nota ${nft.rating.average.toFixed(1)} de 5, com ${String(nft.rating.count)} avaliações`}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border-soft px-2 py-1 text-xs text-text-secondary"
          >
            <Star aria-hidden="true" className="size-3.5 fill-primary text-primary" />
            <span aria-hidden="true">
              <strong className="font-bold text-text-primary">
                {nft.rating.average.toFixed(1)}
              </strong>{' '}
              ({nft.rating.count})
            </span>
          </p>
        </div>
        <Price nft={nft} className="text-base" />
        <p className="text-sm leading-6 text-text-secondary">{nft.description}</p>
        <EditionSelector
          editions={nft.editions}
          value={selection.edition?.id}
          onChange={selection.selectEdition}
        />
        <TokenInfo nft={nft} />
      </div>

      <MobileBuyBar nft={nft} selection={selection} totalLabel={total} />

      <div className="flex flex-col gap-12 px-6 pt-10 pb-16">
        <NftInfoTabs nft={nft} />
        <ShareLinks title={nft.name} url={window.location.href} />
        <RelatedNfts nft={nft} />
      </div>
    </div>
  )
}

/** O estado de edição/quantidade nasce no `key` do NFT, então trocar de NFT o reinicia. */
export function NftDetailView({ nft }: { nft: NftDetail }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  return isDesktop ? (
    <DesktopDetail key={nft.id} nft={nft} />
  ) : (
    <MobileDetail key={nft.id} nft={nft} />
  )
}
