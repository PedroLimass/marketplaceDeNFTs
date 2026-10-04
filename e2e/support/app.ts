import { expect, type Page } from '@playwright/test'

export type Scenario =
  | 'default'
  | 'empty'
  | 'slow-network'
  | 'out-of-order'
  | 'flaky'
  | 'offline'
  | 'server-error'
  | 'timeout'
  | 'expired-session'
  | 'unauthorized'
  | 'signup-conflict'
  | 'invalid-coupon'
  | 'checkout-price-change'
  | 'checkout-sold-out'
  | 'order-timeout'
  | 'payment-rejected'
  | 'wallet-refused'

export const NOVA = { email: 'nova@kurio.test', password: 'Kurio@2026' }

/** Abre a página com o cenário do mock escolhido pela URL e espera os mocks ficarem prontos. */
export async function open(page: Page, path = '/', scenario: Scenario = 'default') {
  const separator = path.includes('?') ? '&' : '?'
  await page.goto(`${path}${separator}scenario=${scenario}`)
  await page.waitForFunction(() => window.__mockControl !== undefined)
}

export async function login(page: Page, redirect = '/', credentials = NOVA) {
  await open(page, `/login?redirect=${encodeURIComponent(redirect)}`)
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(credentials.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(credentials.password)
  await dialog.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

/** Espera o socket do app conectar ao servidor Socket.IO do mock. */
export async function waitForSocket(page: Page) {
  await page.waitForFunction(() => (window.__mockControl?.connectedSockets() ?? 0) > 0)
}

export async function addToCartFromDetail(page: Page, nftId = 'emerald-ape-042') {
  await page.goto(`/nfts/${nftId}`)
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page).toHaveURL(/\/cart$/)
}

export async function startCheckout(page: Page) {
  await expect(page.getByRole('table', { name: 'NFTs no carrinho' })).toBeVisible()
  const summary = page.getByRole('complementary', { name: 'Resumo da carteira' })
  await summary.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pagamento' })).toBeVisible()
}

export async function confirmPurchase(page: Page) {
  const button = page.getByRole('button', { name: 'Confirmar compra' })
  await expect(button).toBeEnabled()
  await button.click()
}
