import { authHandlers } from './auth.handlers'
import { scenarioHandler } from './scenario.handler'

/** A ordem importa: o handler de cenário precisa vir antes dos de domínio. */
export const handlers = [scenarioHandler, ...authHandlers]
