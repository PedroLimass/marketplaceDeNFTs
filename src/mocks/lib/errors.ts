import { HttpResponse } from 'msw'
import { z } from 'zod'

export function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  return HttpResponse.json(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status },
  )
}

export function validationErrorResponse(error: z.ZodError) {
  return errorResponse(
    422,
    'validation_failed',
    'Os dados enviados são inválidos.',
    z.flattenError(error).fieldErrors,
  )
}

/** Corpo malformado é tratado como erro de validação, não como falha do servidor. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}
