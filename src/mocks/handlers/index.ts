import { authHandlers } from './auth.handlers'
import { cartHandlers } from './cart.handlers'
import { catalogHandlers } from './catalog.handlers'
import { favoritesHandlers } from './favorites.handlers'
import { ordersHandlers } from './orders.handlers'
import { profileHandlers } from './profile.handlers'
import { quoteHandlers } from './quotes.handlers'
import { scenarioHandler } from './scenario.handler'
import { walletsHandlers } from './wallets.handlers'

export const handlers = [
  scenarioHandler,
  ...authHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...ordersHandlers,
  ...profileHandlers,
  ...walletsHandlers,
]
