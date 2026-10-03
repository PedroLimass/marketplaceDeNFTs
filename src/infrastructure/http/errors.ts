import { isAxiosError } from 'axios'
import { z } from 'zod'

export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'transient'
  | 'timeout'
  | 'network'
  | 'unknown'

export type FieldErrors = Record<string, string[]>

const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    details: z.unknown().optional(),
  }),
})

const RETRYABLE_KINDS: readonly ApiErrorKind[] = ['transient', 'timeout', 'network']

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | undefined
  readonly code: string
  readonly fieldErrors: FieldErrors
  readonly details: unknown

  constructor(init: {
    kind: ApiErrorKind
    message: string
    code?: string | undefined
    status?: number | undefined
    fieldErrors?: FieldErrors | undefined
    details?: unknown
    cause?: unknown
  }) {
    super(init.message, { cause: init.cause })
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status
    this.code = init.code ?? init.kind
    this.fieldErrors = init.fieldErrors ?? {}
    this.details = init.details
  }

  get retryable(): boolean {
    return RETRYABLE_KINDS.includes(this.kind)
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return 'validation'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 408) return 'timeout'
  if (status === 429 || status >= 500) return 'transient'
  return 'unknown'
}

const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  validation: 'Os dados enviados são inválidos.',
  unauthorized: 'Sua sessão é inválida ou expirou.',
  forbidden: 'Você não tem permissão para realizar esta ação.',
  not_found: 'O recurso solicitado não foi encontrado.',
  conflict: 'A operação entrou em conflito com o estado atual.',
  transient: 'O serviço está indisponível no momento. Tente novamente.',
  timeout: 'A requisição demorou demais para responder.',
  network: 'Não foi possível conectar ao servidor.',
  unknown: 'Ocorreu um erro inesperado.',
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (!isAxiosError(error)) {
    return new ApiError({
      kind: 'unknown',
      message: error instanceof Error ? error.message : DEFAULT_MESSAGES.unknown,
      cause: error,
    })
  }

  const response = error.response

  if (!response) {
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
    const kind: ApiErrorKind = isTimeout ? 'timeout' : 'network'
    return new ApiError({ kind, message: DEFAULT_MESSAGES[kind], cause: error })
  }

  const kind = kindFromStatus(response.status)
  const body = apiErrorBodySchema.safeParse(response.data)

  if (body.success) {
    const { code, message, fieldErrors, details } = body.data.error
    return new ApiError({
      kind,
      message,
      code,
      status: response.status,
      fieldErrors,
      details,
      cause: error,
    })
  }

  return new ApiError({
    kind,
    message: DEFAULT_MESSAGES[kind],
    status: response.status,
    cause: error,
  })
}
