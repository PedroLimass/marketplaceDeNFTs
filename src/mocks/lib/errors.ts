import { HttpResponse } from 'msw'
import { z } from 'zod'

export function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
  details?: unknown,
) {
  return HttpResponse.json(
    {
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
        ...(details === undefined ? {} : { details }),
      },
    },
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

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return undefined
  }
}
