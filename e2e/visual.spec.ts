import { expect, test, type Page } from '@playwright/test'

import { addToCartFromDetail, login, open, startCheckout } from './support/app'

async function settle(page: Page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach((image) => {
      image.loading = 'eager'
    })
    await Promise.all(
      Array.from(document.images).map((image) =>
        image.complete
          ? undefined
          : new Promise((resolve) => {
              image.addEventListener('load', resolve, { once: true })
              image.addEventListener('error', resolve, { once: true })
            }),
      ),
    )
    await document.fonts.ready
  })
  await page.waitForLoadState('networkidle')
}

test.describe('Regressão visual', () => {
  test('Início', async ({ page }) => {
    await open(page, '/')
    await expect(page.getByText(/NFTs encontrados\. Página 1 de/)).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
  })

  test('Detalhes do NFT', async ({ page }) => {
    await open(page, '/nfts/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
  })

  test('Carrinho', async ({ page }) => {
    await login(page)
    await addToCartFromDetail(page)
    await expect(page.getByRole('heading', { level: 1, name: 'Carrinho de NFTs' })).toBeVisible()
    await settle(page)
    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
  })

  test('Pagamento', async ({ page }) => {
    await login(page)
    await addToCartFromDetail(page)
    await startCheckout(page)
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
    await settle(page)
    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
  })
})
