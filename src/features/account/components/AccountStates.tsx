import { isApiError } from '@/infrastructure/http/errors'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export function AccountSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-8">
      <Skeleton className="h-4 w-52" />
      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[66px] w-full" />
        ))}
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

export function AccountLoadError({
  error,
  onRetry,
  subject,
}: {
  error: unknown
  onRetry: () => void
  subject: string
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface-card px-6 py-16 text-center"
    >
      <p className="max-w-md text-sm text-text-secondary">
        {isApiError(error) && error.kind !== 'unknown'
          ? error.message
          : `Não foi possível carregar ${subject}.`}
      </p>
      <Button type="button" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}
