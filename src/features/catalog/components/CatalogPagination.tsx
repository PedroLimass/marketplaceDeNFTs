import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

import { getPageItems } from '../utils/pagination'

interface CatalogPaginationProps {
  page: number
  totalPages: number
  onNavigate: () => void
}

const baseClass =
  'flex size-[35px] items-center justify-center rounded-sm border border-border text-lg leading-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-text-accent'

export function CatalogPagination({ page, totalPages, onNavigate }: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  const goTo = (target: number) => (previous: Record<string, unknown>) => ({
    ...previous,
    page: target > 1 ? target : undefined,
  })

  return (
    <nav aria-label="Paginação" className="flex items-center gap-2 self-end">
      {page > 1 ? (
        <Link
          to="/"
          search={goTo(page - 1)}
          resetScroll={false}
          onClick={onNavigate}
          aria-label="Página anterior"
          className={baseClass}
        >
          <ChevronLeft className="size-[18px]" aria-hidden="true" />
        </Link>
      ) : null}

      {getPageItems(page, totalPages).map((item) =>
        typeof item === 'string' ? (
          <span key={item} aria-hidden="true" className="px-1 text-lg text-text-secondary">
            …
          </span>
        ) : (
          <Link
            key={item}
            to="/"
            search={goTo(item)}
            resetScroll={false}
            onClick={onNavigate}
            aria-label={`Página ${String(item)}`}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              baseClass,
              item === page && 'border-primary bg-primary font-bold text-ink',
            )}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          to="/"
          search={goTo(page + 1)}
          resetScroll={false}
          onClick={onNavigate}
          aria-label="Próxima página"
          className={baseClass}
        >
          <ChevronRight className="size-[18px]" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  )
}
