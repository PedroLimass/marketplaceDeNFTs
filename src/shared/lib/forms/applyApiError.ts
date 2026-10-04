import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { isApiError } from '@/infrastructure/http/errors'

export const GENERIC_ERROR_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.'

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

export function applyApiMessage(error: unknown): string {
  if (!isApiError(error)) return GENERIC_ERROR_MESSAGE
  return Object.values(error.fieldErrors)[0]?.[0] ?? error.message
}
