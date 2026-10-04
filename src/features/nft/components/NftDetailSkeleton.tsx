import { NftCardSkeleton } from '@/features/catalog/components/NftCardSkeleton'
import { Skeleton } from '@/shared/ui/skeleton'

export function NftDetailSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando NFT"
      className="mx-auto flex w-full max-w-[1200px] flex-col gap-16 px-4 pt-8 pb-24 md:px-8 xl:px-0"
    >
      <div className="flex flex-col gap-7">
        <Skeleton className="h-4 w-40" />
        <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-[573px_minmax(0,1fr)]">
          <div className="flex w-full max-w-[573px] items-start gap-4">
            <div className="hidden w-20 shrink-0 flex-col gap-4 md:flex lg:w-[100px]">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="aspect-square w-full flex-1 rounded-xl md:rounded-lg" />
          </div>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 border-b border-border-soft pb-4">
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-5 w-full max-w-sm" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-48 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-12 w-[130px]" />
              <Skeleton className="h-12 w-[130px]" />
            </div>
            <Skeleton className="h-24 w-full max-w-xs" />
          </div>
        </div>
      </div>
      <div className="hidden flex-col gap-4 md:flex">
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <ul aria-hidden="true" className="hidden grid-cols-5 gap-6 lg:grid">
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  )
}
