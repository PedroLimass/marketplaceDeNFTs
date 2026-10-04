import { useNavigate, useRouterState } from '@tanstack/react-router'

export function useLoginRedirect() {
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })

  return () => {
    void navigate({ to: '/login', search: { redirect: href } })
  }
}
