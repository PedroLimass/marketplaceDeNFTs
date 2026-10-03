import { Link } from '@tanstack/react-router'

import { assetUrl } from '@/shared/lib/assetUrl'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'

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
    <div className="@container">
      <article
        aria-labelledby={titleId}
        className="group relative isolate flex h-full flex-col overflow-hidden rounded-lg bg-surface-card ring-1 ring-transparent transition-shadow duration-200 hover:ring-border-soft has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-primary @xl:h-[250px] @xl:flex-row"
      >
        <div className="h-40 w-full overflow-hidden @xl:-ml-1 @xl:h-full @xl:w-1/2 @xl:rounded-[18px]">
          <img
            src={assetUrl(`assets/nfts/${promo.art}-500.webp`)}
            alt=""
            width={500}
            height={500}
            loading="lazy"
            decoding="async"
            className="size-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col gap-6 p-6 @xl:items-end @xl:justify-between @xl:pt-[37px] @xl:pr-[30px] @xl:pb-[46px] @xl:pl-0 @xl:text-right">
          <div className="flex flex-col gap-2 @xl:gap-[9px]">
            <h2
              id={titleId}
              className="flex flex-col text-lg leading-6 font-bold text-balance text-foreground"
            >
              {promo.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p className="text-sm leading-6 text-pretty text-text-secondary">{promo.description}</p>
          </div>

          {/* O link cobre o card inteiro (after:absolute) para o alvo de clique ser o banner todo. */}
          <Link
            to="/"
            search={promo.listing ? { listing: promo.listing } : {}}
            hash="catalogo"
            aria-label={`Explorar: ${promo.title.join(' ')}`}
            className={cn(
              buttonVariants(),
              "w-fit min-w-[140px] font-medium group-hover:bg-text-accent focus-visible:ring-0 focus-visible:ring-offset-0 after:absolute after:inset-0 after:z-10 after:content-['']",
            )}
          >
            Explorar
            <span aria-hidden="true" className="flex size-[18px] items-center justify-center">
              <img
                src={promoArrow}
                alt=""
                width={11}
                height={13}
                className="-rotate-90 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>

        <img
          src={promoCircles}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 -z-10 hidden h-[250px] w-[586px] max-w-none @xl:z-0 @xl:block"
        />
      </article>
    </div>
  )
}

/**
 * Dois destaques lado a lado a partir de `lg`. O layout interno de cada banner depende da largura
 * do próprio card (consulta de contêiner): com ~576 px ou mais é o do Figma (imagem à esquerda,
 * texto à direita); mais estreito, a imagem vai para cima e o texto para baixo.
 */
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
