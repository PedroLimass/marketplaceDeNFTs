import { useMutation, useQueryClient } from '@tanstack/react-query'

import { login, logout, register } from '../api/authApi'
import { endSession, startSession } from '../session/sessionCache'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      startSession(queryClient, result)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: register,
    onSuccess: (result) => {
      startSession(queryClient, result)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    // Sair precisa funcionar mesmo offline ou com o token já vencido.
    onSettled: () => {
      endSession(queryClient)
    },
  })
}
