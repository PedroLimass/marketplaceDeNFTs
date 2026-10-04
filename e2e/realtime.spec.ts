import { expect, test } from '@playwright/test'

import { addToCartFromDetail, login, open, waitForSocket } from './support/app'

test.describe('Tempo real (Socket.IO sobre MSW)', () => {
  test('o preço do detalhe muda sem recarregar quando o servidor emite nft.updated', async ({
    page,
  }) => {
    await open(page, '/nfts/emerald-ape-042')
    await waitForSocket(page)
    const price = page.getByRole('main').getByText('1.19 ETH').first()
    await expect(price).toBeVisible()

    await page.evaluate(() => {
      window.__mockControl?.setNftPrice('emerald-ape-042', '1.45')
    })

    await expect(page.getByRole('main').getByText('1.45 ETH').first()).toBeVisible()
  })

  test('evento repetido e evento de versão antiga não alteram a tela', async ({ page }) => {
    await open(page, '/nfts/emerald-ape-042')
    await waitForSocket(page)
    await expect(page.getByRole('main').getByText('1.19 ETH').first()).toBeVisible()

    await page.evaluate(() => {
      window.__mockControl?.setNftPrice('emerald-ape-042', '1.45')
    })
    await expect(page.getByRole('main').getByText('1.45 ETH').first()).toBeVisible()

    await page.evaluate(() => {
      window.__mockControl?.replayLastEvent()
      window.__mockControl?.sendStaleNftEvent('emerald-ape-042')
    })
    await page.waitForTimeout(500)

    await expect(page.getByRole('main').getByText('1.45 ETH').first()).toBeVisible()
    await expect(page.getByRole('main').getByText('999 ETH')).toHaveCount(0)
  })

  test('NFT que está no carrinho gera aviso e atualiza o carrinho', async ({ page }) => {
    await login(page)
    await addToCartFromDetail(page)
    await waitForSocket(page)
    await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()

    await page.evaluate(() => {
      window.__mockControl?.setNftPrice('emerald-ape-042', '1.45')
    })

    await expect(
      page.getByRole('status').filter({ hasText: 'Atualizamos o seu carrinho' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aceitar novo preço' })).toBeVisible()
  })

  test('depois de uma queda do socket o app reconecta e reconcilia com a API', async ({ page }) => {
    await open(page, '/nfts/emerald-ape-042')
    await waitForSocket(page)

    await page.evaluate(() => {
      window.__mockControl?.disconnectSockets()
    })
    await page.waitForFunction(() => window.__mockControl?.connectedSockets() === 0)
    await page.waitForFunction(() => (window.__mockControl?.connectedSockets() ?? 0) > 0, null, {
      timeout: 20_000,
    })

    await page.evaluate(() => {
      window.__mockControl?.setNftPrice('emerald-ape-042', '1.50')
    })
    await expect(page.getByRole('main').getByText('1.50 ETH').first()).toBeVisible()
  })
})
