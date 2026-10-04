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

/**
 * Como `applyApiError`, para quando o nome do campo na API (`ens_name`) difere do nome no
 * formulário (`ensName`). `fields` mapeia o primeiro para o segundo.
 */
export function applyMappedApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Readonly<Record<string, Path<T>>>,
): string | null {
  if (!isApiError(error)) return GENERIC_ERROR_MESSAGE

  let assigned = false
  for (const [apiField, formField] of Object.entries(fields)) {
    const message = error.fieldErrors[apiField]?.[0]
    if (message) {
      setError(formField, { type: 'server', message })
      assigned = true
    }
  }

  return assigned ? null : error.message
}

/** Mensagem pronta para exibir quando a falha não pertence a nenhum campo. */
export function applyApiMessage(error: unknown): string {
  if (!isApiError(error)) return GENERIC_ERROR_MESSAGE
  return Object.values(error.fieldErrors)[0]?.[0] ?? error.message
}
