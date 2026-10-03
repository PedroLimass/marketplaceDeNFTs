import { Skeleton } from '@/shared/ui/skeleton'

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <div className="px-1 pt-3 pb-5 md:bg-surface-card md:pt-6 md:pb-[26px]">
        <Skeleton className="aspect-square w-full rounded-2xl md:rounded-[15px]" />
      </div>
      <div className="flex flex-col gap-2 pl-2 md:gap-3 md:pl-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}
