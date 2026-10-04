import { expect, test, type Page } from '@playwright/test'

import { addToCartFromDetail, confirmPurchase, login, open, startCheckout } from './support/app'

const WIDTHS = [320, 390, 768, 1440] as const

async function expectNoHorizontalScroll(page: Page, label: string) {
  await page.waitForLoadState('networkidle')
  const overflow = await page.evaluate(() => {
    const root = document.documentElement
    return { scroll: root.scrollWidth, client: root.clientWidth }
  })
  expect(
    overflow.scroll,
    `${label}: scrollWidth ${String(overflow.scroll)} > ${String(overflow.client)}`,
  ).toBeLessThanOrEqual(overflow.client)
}

for (const width of WIDTHS) {
  test.describe(`sem rolagem horizontal em ${String(width)} px`, () => {
    test.use({ viewport: { width, height: 800 } })

    test('telas públicas', async ({ page }) => {
      await open(page, '/')
      await expect(page.getByRole('main')).toBeVisible()
      await expectNoHorizontalScroll(page, 'Início')

      await open(page, '/nfts/emerald-ape-042')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectNoHorizontalScroll(page, 'Detalhe do NFT')

      await open(page, '/login')
      await expect(page.getByRole('dialog')).toBeVisible()
      await expectNoHorizontalScroll(page, 'Login')

      await open(page, '/signup')
      await expect(page.getByRole('dialog')).toBeVisible()
      await expectNoHorizontalScroll(page, 'Cadastro')
    })

    test('carrinho, pagamento, recibo, perfil e carteiras', async ({ page }) => {
      await login(page)
      await addToCartFromDetail(page)
      await expectNoHorizontalScroll(page, 'Carrinho')

      await startCheckout(page)
      await expectNoHorizontalScroll(page, 'Pagamento')

      await confirmPurchase(page)
      await expect(page).toHaveURL(/\/orders\//)
      await expectNoHorizontalScroll(page, 'Confirmação (pendente)')
      await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
        timeout: 15_000,
      })
      await expectNoHorizontalScroll(page, 'Confirmação (recibo)')

      await page.goto('/profile')
      await expect(page.getByRole('form', { name: 'Perfil do colecionador' })).toBeVisible()
      await expectNoHorizontalScroll(page, 'Perfil')

      await page.goto('/profile/wallets')
      await expect(page.getByRole('heading', { name: /Carteiras/ }).first()).toBeVisible()
      await expectNoHorizontalScroll(page, 'Carteiras')
    })
  })
}
