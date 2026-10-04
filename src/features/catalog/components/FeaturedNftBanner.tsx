import { Skeleton } from '@/shared/ui/skeleton'

import { useFeaturedNfts } from '../hooks/useCatalog'

export function FeaturedNftBanner() {
  const { data, isPending } = useFeaturedNfts()

  if (isPending) {
    return <Skeleton aria-hidden="true" className="h-[470px] w-full rounded-none" />
  }
  if (!data) return null

  const { featured } = data

  return (
    <section
      aria-labelledby="destaque-titulo"
      className="relative flex h-[470px] flex-col gap-4 overflow-hidden bg-linear-to-b from-primary/10 to-primary/[0.03] pt-6 pb-1"
    >
      <div className="flex flex-col items-center gap-4 px-5">
        <h3 id="destaque-titulo" className="w-full text-2xl leading-8 font-bold text-text-accent">
          NFT EM DESTAQUE
        </h3>
        <p className="text-[22px] leading-4 font-bold text-foreground">OFERTA LIMITADA</p>
      </div>
      <img
        src={featured.imageUrl}
        alt={`${featured.name}, em oferta limitada`}
        width={1000}
        height={1000}
        loading="lazy"
        className="h-[368px] w-full rounded-[22px] object-cover"
      />
      <span
        aria-hidden="true"
        className="absolute top-[299px] left-4 size-[22px] rounded-[7px] border-2 border-[#46a358] opacity-20"
      />
      <span
        aria-hidden="true"
        className="absolute top-[343px] left-[248px] size-[45px] rounded-full bg-linear-[145deg] from-primary/30 from-46% to-primary/0"
      />
      <span
        aria-hidden="true"
        className="absolute top-[105px] left-[38px] size-[15px] rounded-full bg-linear-[145deg] from-primary/30 from-46% to-primary/0"
      />
    </section>
  )
}
