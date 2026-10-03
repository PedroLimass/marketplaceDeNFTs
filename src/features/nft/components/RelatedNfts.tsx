import { NftCard } from '@/features/catalog/components/NftCard'
import { NftCardSkeleton } from '@/features/catalog/components/NftCardSkeleton'
import { useRelatedNfts } from '@/features/catalog/hooks/useCatalog'
import type { NftDetail } from '@/features/catalog/types/catalog'

const gridClass =
  'grid grid-cols-2 gap-x-3.5 gap-y-6 min-[560px]:grid-cols-3 md:gap-x-6 lg:grid-cols-5'

/** Outros NFTs da coleção. É um complemento: se falhar ou não houver nada, a seção some. */
export function RelatedNfts({ nft }: { nft: NftDetail }) {
  const related = useRelatedNfts(nft.collection.id, nft.id)

  if (related.isError || (related.isSuccess && related.data.length === 0)) return null

  return (
    <section aria-labelledby="relacionados-titulo" className="flex flex-col gap-8">
      <h2
        id="relacionados-titulo"
        className="border-b border-border-soft pb-3 text-[15px] leading-4 font-bold text-text-primary"
      >
        Mais desta coleção
      </h2>
      {related.isPending ? (
        <ul aria-hidden="true" className={gridClass}>
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : (
        <ul className={gridClass}>
          {related.data.map((item) => (
            <li key={item.id}>
              <NftCard nft={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
