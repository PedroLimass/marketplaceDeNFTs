import { authHandlers } from './auth.handlers'
import { cartHandlers } from './cart.handlers'
import { catalogHandlers } from './catalog.handlers'
import { favoritesHandlers } from './favorites.handlers'
import { quoteHandlers } from './quotes.handlers'
import { scenarioHandler } from './scenario.handler'

/** A ordem importa: o handler de cenário precisa vir antes dos de domínio. */
export const handlers = [
  scenarioHandler,
  ...authHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...quoteHandlers,
]
