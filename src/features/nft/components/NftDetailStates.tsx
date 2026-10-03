import { Link } from '@tanstack/react-router'
import { PackageSearch, TriangleAlert } from 'lucide-react'

import { isApiError } from '@/infrastructure/http/errors'
import { buttonVariants } from '@/shared/ui/button'
import { Button } from '@/shared/ui/button'

export function NftNotFound() {
  return (
    <section className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-4 px-4 py-24 text-center">
      <PackageSearch className="size-10 text-text-accent" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-foreground">NFT não encontrado</h1>
      <p className="text-sm leading-6 text-text-secondary">
        Este NFT não existe ou foi removido do catálogo. Confira o endereço ou explore outros
        lançamentos.
      </p>
      <Link to="/" className={buttonVariants({ className: 'mt-2' })}>
        Voltar ao catálogo
      </Link>
    </section>
  )
}

export function NftLoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const connection = isApiError(error) && (error.kind === 'network' || error.kind === 'timeout')

  return (
    <section
      role="alert"
      className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-4 px-4 py-24 text-center"
    >
      <TriangleAlert className="size-10 text-text-coral" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-foreground">
        {connection ? 'Sem conexão' : 'Não foi possível carregar o NFT'}
      </h1>
      <p className="text-sm leading-6 text-text-secondary">
        {isApiError(error) ? error.message : 'Ocorreu um erro inesperado. Tente novamente.'}
      </p>
      <Button type="button" onClick={onRetry}>
        Tentar novamente
      </Button>
    </section>
  )
}
