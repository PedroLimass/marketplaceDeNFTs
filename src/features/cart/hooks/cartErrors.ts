import { isApiError } from '@/infrastructure/http/errors'

export function describeCartError(error: unknown): string {
  if (isApiError(error)) {
    if (error.code === 'insufficient_availability') return error.message
    if (error.kind === 'network' || error.kind === 'timeout') {
      return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'
    }
    return error.message
  }
  return 'Não foi possível atualizar o carrinho. Tente novamente.'
}
