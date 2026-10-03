import { SearchX, TriangleAlert } from 'lucide-react'

import { isApiError } from '@/infrastructure/http/errors'
import { Button } from '@/shared/ui/button'

const errorTitles = {
  network: 'Sem conexão',
  timeout: 'A busca demorou demais',
} as const

function describeError(error: unknown): { title: string; message: string } {
  if (isApiError(error)) {
    const title =
      error.kind === 'network' || error.kind === 'timeout'
        ? errorTitles[error.kind]
        : 'Não foi possível carregar o catálogo'
    return { title, message: error.message }
  }

  return {
    title: 'Não foi possível carregar o catálogo',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
  }
}

export function CatalogError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { title, message } = describeError(error)

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 border border-border bg-surface-card px-6 py-16 text-center"
    >
      <TriangleAlert className="size-8 text-text-coral" aria-hidden="true" />
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="max-w-md text-sm text-text-secondary">{message}</p>
      <Button type="button" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}

export function CatalogEmpty({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean
  onClear: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 border border-border bg-surface-card px-6 py-16 text-center">
      <SearchX className="size-8 text-text-accent" aria-hidden="true" />
      <h3 className="text-lg font-bold text-foreground">Nenhum NFT encontrado</h3>
      <p className="max-w-md text-sm text-text-secondary">
        {hasFilters
          ? 'Nenhum NFT corresponde à busca ou aos filtros escolhidos. Tente ampliar a seleção.'
          : 'O catálogo está vazio no momento. Volte em breve para ver novos lançamentos.'}
      </p>
      {hasFilters ? (
        <Button type="button" onClick={onClear}>
          Limpar filtros
        </Button>
      ) : null}
    </div>
  )
}
