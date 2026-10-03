import { useNavigate, useRouterState, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState, type SubmitEvent } from 'react'

import searchMobileIcon from '@/shared/assets/icons/search-mobile.svg'
import searchIcon from '@/shared/assets/icons/search.svg'
import { cn } from '@/shared/lib/utils'

import { MAX_SEARCH_LENGTH } from '../constants'
import { validateCatalogSearch } from '../search/catalogSearch'

const DEBOUNCE_MS = 350

interface CatalogSearchFieldProps {
  variant: 'header' | 'mobile'
  focusOnMount?: boolean
  onEscape?: () => void
  className?: string
}

/**
 * Campo de busca do catálogo. Funciona de qualquer rota: ao digitar (com atraso) ou enviar,
 * leva para o Início com `?q=`. Já no Início, substitui a entrada do histórico em vez de
 * empilhar uma por tecla.
 */
export function CatalogSearchField({
  variant,
  focusOnMount = false,
  onEscape,
  className,
}: CatalogSearchFieldProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const onHome = useRouterState({ select: (state) => state.location.pathname === '/' })
  const rawSearch = useSearch({ strict: false })
  const urlQuery = validateCatalogSearch(rawSearch).q ?? ''

  // Reflete mudanças vindas de fora (ex.: "Limpar filtros") sem atropelar quem está digitando.
  const [text, setText] = useState(urlQuery)
  const [seenQuery, setSeenQuery] = useState(urlQuery)
  if (urlQuery !== seenQuery) {
    setSeenQuery(urlQuery)
    if (urlQuery !== text.trim()) setText(urlQuery)
  }

  const commit = (value: string) => {
    const query = value.trim()
    if (query === urlQuery) return

    void navigate({
      to: '/',
      search: (previous) => ({ ...previous, q: query === '' ? undefined : query, page: undefined }),
      replace: onHome,
    })
  }

  useEffect(() => {
    // Só a busca digitada em um campo do Início é automática; fora dele, só ao enviar.
    if (!onHome) return
    const timer = setTimeout(() => {
      commit(text)
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
    }
    // `commit` depende de `urlQuery`/`onHome`, que já fazem o efeito reagendar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, onHome, urlQuery])

  useEffect(() => {
    if (focusOnMount) inputRef.current?.focus()
  }, [focusOnMount])

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    commit(text)
  }

  const isMobile = variant === 'mobile'

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        'flex items-center gap-2 bg-surface-card',
        isMobile ? 'h-[45px] rounded-[10px] px-3' : 'h-[35px] rounded-md border border-border px-3',
        className,
      )}
    >
      <img
        src={isMobile ? searchMobileIcon : searchIcon}
        alt=""
        width={isMobile ? 22 : 16}
        height={isMobile ? 22 : 16}
        className={isMobile ? '' : 'size-4'}
      />
      <input
        type="search"
        name="q"
        value={text}
        maxLength={MAX_SEARCH_LENGTH}
        ref={inputRef}
        autoComplete="off"
        aria-label="Buscar NFTs"
        placeholder={isMobile ? 'Explorar coleções' : 'Buscar NFTs'}
        onChange={(event) => {
          setText(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onEscape?.()
        }}
        className={cn(
          'min-w-0 flex-1 bg-transparent outline-none placeholder:text-brand-secondary [&::-webkit-search-cancel-button]:appearance-none',
          isMobile
            ? 'text-sm leading-4 font-bold text-foreground placeholder:font-bold'
            : 'text-sm text-foreground',
        )}
      />
    </form>
  )
}
