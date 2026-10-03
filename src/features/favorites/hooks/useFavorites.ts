import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useSession } from '@/features/auth/hooks/useSession'
import { isApiError } from '@/infrastructure/http/errors'
import { toast } from '@/shared/lib/toast'

import { fetchFavoriteIds, favoritesKeys, setFavorite } from '../api/favoritesApi'

const NO_FAVORITES: string[] = []

const favoriteIdsQueryOptions = () =>
  queryOptions({
    queryKey: favoritesKeys.ids(),
    queryFn: ({ signal }) => fetchFavoriteIds(signal),
  })

/** Ids favoritados do usuário autenticado. Visitante: lista vazia, sem requisição. */
export function useFavoriteIds() {
  const { data: session } = useSession()
  const query = useQuery({ ...favoriteIdsQueryOptions(), enabled: Boolean(session) })

  return { ids: query.data ?? NO_FAVORITES, isPending: query.isPending }
}

interface ToggleVariables {
  nftId: string
  favorite: boolean
}

/**
 * Atualização otimista: o coração muda na hora e volta ao estado anterior se a API falhar.
 * O `onSettled` reconcilia com o servidor, que é a fonte de verdade.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const key = favoritesKeys.ids()

  return useMutation({
    mutationFn: ({ nftId, favorite }: ToggleVariables) => setFavorite(nftId, favorite),
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<string[]>(key)

      queryClient.setQueryData<string[]>(key, (current = []) =>
        favorite
          ? current.includes(nftId)
            ? current
            : [...current, nftId]
          : current.filter((id) => id !== nftId),
      )

      return { previous }
    },
    onError: (error, { favorite }, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      else queryClient.removeQueries({ queryKey: key })

      const unauthorized = isApiError(error) && error.kind === 'unauthorized'
      if (!unauthorized) {
        toast.error(
          favorite
            ? 'Não foi possível adicionar aos favoritos. Tente novamente.'
            : 'Não foi possível remover dos favoritos. Tente novamente.',
        )
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
