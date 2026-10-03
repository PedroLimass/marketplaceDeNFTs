import { Link } from '@tanstack/react-router'

import { assetUrl } from '@/shared/lib/assetUrl'

import promoArrow from '../assets/promo-arrow.svg'
import promoCircles from '../assets/promo-circles.svg'

interface Promo {
  id: string
  title: readonly [string, string]
  description: string
  art: 'art-1' | 'art-3'
  listing?: 'new'
}

const promos: readonly Promo[] = [
  {
    id: 'genesis',
    title: ['Lançamentos gênesis', 'de edição limitada'],
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    art: 'art-1',
    listing: 'new',
  },
  {
    id: 'curated',
    title: ['Arte digital selecionada', 'e muito mais'],
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    art: 'art-3',
  },
]

function PromoCard({ promo }: { promo: Promo }) {
  const titleId = `promo-${promo.id}`

  return (
    <article
      aria-labelledby={titleId}
      className="relative isolate flex flex-col overflow-hidden rounded-lg bg-surface-card md:h-[250px] md:flex-row"
    >
      <img
        src={assetUrl(`assets/nfts/${promo.art}-500.webp`)}
        alt=""
        width={500}
        height={500}
        loading="lazy"
        decoding="async"
        className="h-44 w-full object-cover md:-ml-1 md:h-full md:w-1/2 md:rounded-[18px]"
      />

      <div className="flex flex-1 flex-col gap-6 p-6 md:items-end md:justify-between md:pt-[37px] md:pr-[30px] md:pb-[46px] md:pl-0 md:text-right">
        <div className="flex flex-col gap-2 md:gap-[9px]">
          <h2 id={titleId} className="flex flex-col text-lg leading-6 font-bold text-foreground">
            {promo.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className="text-sm leading-6 text-text-secondary">{promo.description}</p>
        </div>

        <Link
          to="/"
          search={promo.listing ? { listing: promo.listing } : {}}
          hash="catalogo"
          className="inline-flex h-10 w-[140px] items-center justify-center rounded-[6px] bg-primary text-sm leading-5 font-medium text-ink outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
        >
          Explorar
          <span aria-hidden="true" className="flex size-[18px] items-center justify-center">
            <img src={promoArrow} alt="" width={11} height={13} className="-rotate-90" />
          </span>
        </Link>
      </div>

      <img
        src={promoCircles}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 -z-10 hidden h-[250px] w-[586px] max-w-none md:z-0 md:block"
      />
    </article>
  )
}

/** Dois destaques lado a lado abaixo do catálogo; empilham quando falta espaço. */
export function PromoBanners() {
  return (
    <section
      aria-label="Destaques"
      className="mx-auto mt-12 grid w-full max-w-[1200px] gap-6 px-6 md:mt-0 md:px-8 lg:grid-cols-2 lg:gap-7 xl:px-0"
    >
      {promos.map((promo) => (
        <PromoCard key={promo.id} promo={promo} />
      ))}
    </section>
  )
}
