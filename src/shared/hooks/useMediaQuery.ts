import { useSyncExternalStore } from 'react'

/**
 * Lê uma media query de forma síncrona (sem piscar no primeiro render). Usado só para
 * conteúdo que muda de texto entre telas; o resto da responsividade é feito em CSS.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => {
        list.removeEventListener('change', notify)
      }
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const DESKTOP_QUERY = '(min-width: 768px)'
