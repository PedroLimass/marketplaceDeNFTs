import { Link } from '@tanstack/react-router'

import { useMediaQuery, DESKTOP_QUERY } from '@/shared/hooks/useMediaQuery'
import { assetUrl } from '@/shared/lib/assetUrl'

import arrowCta from '../assets/arrow-cta.svg'
import heroBgMobile from '../assets/hero-bg-mobile.svg'
import heroDots from '../assets/hero-dots.svg'
import heroDotsMobile from '../assets/hero-dots-mobile.svg'

const copy = {
  desktop: {
    title: ['SEJA DONO DO FUTURO', 'DA ARTE DIGITAL'],
    description:
      'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
  },
  mobile: {
    title: ['SEJA DONO DA', 'CULTURA DIGITAL'],
    description: 'Descubra NFTs selecionados de criadores do mundo todo.',
  },
} as const

/** O texto do banner é mais curto no celular (como no design); o resto é só CSS responsivo. */
export function HeroBanner() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const text = isDesktop ? copy.desktop : copy.mobile

  return (
    <section
      aria-labelledby="hero-titulo"
      className="relative isolate flex items-center justify-between gap-2 overflow-hidden rounded-xl p-4 md:h-[clamp(300px,36vw,450px)] md:gap-0 md:rounded-none md:p-0 md:pl-10"
    >
      <img
        src={heroBgMobile}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 size-full md:hidden"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-4 md:max-w-[600px] md:items-end md:gap-11">
        <div className="flex flex-col gap-4 md:gap-8 md:self-stretch">
          <div className="flex flex-col gap-1.5 text-foreground md:gap-2">
            <p className="text-xs leading-4 font-medium md:text-sm md:tracking-[1.4px]">
              Bem-vindo à Kurio
            </p>
            <h1
              id="hero-titulo"
              className="flex w-full flex-col text-[clamp(13px,4.6vw,18px)] leading-[1.6] font-bold md:text-[clamp(28px,3.4vw,43px)] md:leading-[1.63]"
            >
              {text.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
          </div>
          <p className="text-xs leading-[18px] text-text-secondary md:max-w-[557px] md:text-sm md:leading-6">
            {text.description}
          </p>
          <Link
            to="/"
            hash="catalogo"
            search={(previous) => previous}
            className="flex items-center gap-2 text-xs leading-[14px] font-bold text-text-accent outline-none focus-visible:ring-2 focus-visible:ring-primary md:h-10 md:w-[140px] md:justify-center md:rounded-[6px] md:bg-primary md:py-2.5 md:pr-9 md:pl-7 md:text-base md:leading-5 md:text-ink md:hover:bg-primary/90"
          >
            EXPLORAR
            <img src={arrowCta} alt="" width={10} height={12} className="-rotate-90 md:hidden" />
          </Link>
        </div>
        <img src={heroDots} alt="" width={40} height={8} className="hidden md:block" />
        <img src={heroDotsMobile} alt="" width={33} height={7} className="md:hidden" />
      </div>

      <div className="relative shrink-0 md:h-full">
        <img
          src={assetUrl('assets/nfts/art-1-500.webp')}
          srcSet={`${assetUrl('assets/nfts/art-1-500.webp')} 500w, ${assetUrl('assets/nfts/art-1.webp')} 1000w`}
          sizes="(min-width: 768px) 450px, 138px"
          alt="Emerald Ape #042, macaco com óculos escuros e jaqueta verde"
          width={450}
          height={450}
          fetchPriority="high"
          className="size-[clamp(96px,36vw,138px)] rounded-2xl object-cover md:size-auto md:h-full md:rounded-3xl"
        />
        <img
          src={assetUrl('assets/nfts/art-2-500.webp')}
          alt=""
          aria-hidden="true"
          width={58}
          height={58}
          className="absolute -bottom-2 left-3.5 size-[58px] rounded-2xl object-cover md:hidden"
        />
      </div>
    </section>
  )
}
