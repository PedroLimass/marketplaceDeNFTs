import { Skeleton } from '@/shared/ui/skeleton'

export function CartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando carrinho"
      className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-[86px]"
    >
      <div className="flex flex-col gap-5">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[100px] w-full rounded-xl md:h-[70px]" />
        ))}
      </div>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
