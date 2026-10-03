import { Link } from '@tanstack/react-router'

export function NotFoundPage() {
  return (
    <section className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-medium tracking-[1.4px] text-text-secondary">Erro 404</p>
      <h1 className="text-3xl font-bold text-foreground">Página não encontrada</h1>
      <p className="text-sm leading-6 text-text-secondary">
        O endereço que você acessou não existe ou foi movido.
      </p>
      <Link
        to="/"
        className="mt-2 flex h-10 items-center rounded-md bg-primary px-5 text-base font-bold text-primary-foreground"
      >
        Voltar ao início
      </Link>
    </section>
  )
}
