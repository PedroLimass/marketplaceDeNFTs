import { useNavigate, useRouterState } from '@tanstack/react-router'

/**
 * Devolve uma função que leva o visitante ao login e o traz de volta à tela atual
 * depois de entrar (o destino viaja em `?redirect=`).
 */
export function useLoginRedirect() {
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })

  return () => {
    void navigate({ to: '/login', search: { redirect: href } })
  }
}
