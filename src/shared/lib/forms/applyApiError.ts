import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { isApiError } from '@/infrastructure/http/errors'

export const GENERIC_ERROR_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.'

/**
 * Leva os erros por campo devolvidos pela API para o formulário e devolve a mensagem
 * que deve aparecer no formulário como um todo (credenciais inválidas, rede, etc.).
 * Devolve `null` quando todos os problemas foram atribuídos a campos.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null {
  if (!isApiError(error)) return GENERIC_ERROR_MESSAGE

  let assigned = false
  for (const field of fields) {
    const message = error.fieldErrors[field]?.[0]
    if (message) {
      setError(field, { type: 'server', message })
      assigned = true
    }
  }

  return assigned ? null : error.message
}
