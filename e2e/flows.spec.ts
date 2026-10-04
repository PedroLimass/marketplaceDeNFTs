import { expect, test, type Page } from '@playwright/test'

import { NOVA, confirmPurchase, login, open, startCheckout } from './support/app'

const NFT_PATH = '/nfts/emerald-ape-042'

async function buyUntilCheckout(page: Page, scenario: Parameters<typeof open>[2] = 'default') {
  await login(page)
  await open(page, NFT_PATH, scenario)
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await startCheckout(page)
}

test.describe('Catálogo', () => {
  test('aba, busca e paginação compõem a URL e sobrevivem a refresh e histórico', async ({
    page,
  }) => {
    await open(page, '/')
    await expect(page.getByText(/NFTs encontrados\. Página 1 de/)).toBeVisible()

    await page.getByRole('tab', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/listing=trending/)

    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await page.reload()
    await expect(page.getByRole('tab', { name: 'Em alta', selected: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await page.goBack()
    await expect(page).not.toHaveURL(/page=2/)
    await expect(page.getByRole('link', { name: 'Página 1' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('busca por texto filtra a lista e a URL guarda o termo', async ({ page }, testInfo) => {
    await open(page, '/')
    const search = page.getByRole('searchbox', { name: 'Buscar NFTs' })
    if (testInfo.project.name === 'desktop') {
      await page.getByRole('banner').getByRole('button', { name: 'Buscar NFTs' }).click()
    }
    await search.fill('Emerald')

    await expect(page).toHaveURL(/q=Emerald/)
    const results = page.getByRole('region', { name: 'Catálogo de NFTs' })
    await expect(results.getByRole('article').first()).toContainText('Emerald')

    await page.reload()
    await expect(page.getByRole('article').first()).toContainText('Emerald')
    await expect(page).toHaveURL(/q=Emerald/)
  })
})

test.describe('Carrinho', () => {
  test('o carrinho do visitante sobrevive ao refresh', async ({ page }) => {
    await open(page, NFT_PATH)
    await page.getByRole('button', { name: 'Comprar' }).click()
    await expect(page).toHaveURL(/\/cart$/)

    await page.reload()
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()
  })

  test('ao entrar, o carrinho do visitante é unido ao da conta', async ({ page }) => {
    await open(page, NFT_PATH)
    await page.getByRole('button', { name: 'Comprar' }).click()
    await expect(page).toHaveURL(/\/cart$/)

    await login(page, '/cart')

    await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ }).first()).toBeAttached()
  })

  test('cupom inválido mostra o erro sem esvaziar o carrinho', async ({ page }) => {
    await open(page, NFT_PATH, 'invalid-coupon')
    await page.getByRole('button', { name: 'Comprar' }).click()
    await expect(page).toHaveURL(/\/cart$/)

    await page.getByLabel('Código promocional').fill('CUPOM-FALSO')
    await page.getByRole('button', { name: 'Aplicar' }).click()

    await expect(page.getByRole('alert').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()
  })
})

test.describe('Conta', () => {
  test('entra, sai e perde o acesso às telas privadas', async ({ page }) => {
    await login(page, '/profile')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()

    await page.getByRole('banner').getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()

    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/)
  })

  test('credenciais erradas mostram erro genérico', async ({ page }) => {
    await open(page, '/login')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('E-mail').fill(NOVA.email)
    await dialog.getByLabel('Senha', { exact: true }).fill('SenhaErrada1')
    await dialog.getByRole('button', { name: 'Entrar' }).click()

    await expect(dialog.getByRole('alert')).toContainText('E-mail ou senha incorretos.')
  })

  test('cadastro: e-mail já usado aparece no campo e depois cria a conta', async ({ page }) => {
    await open(page, '/signup')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome de usuário').fill('camila')
    await dialog.getByLabel('E-mail').fill(NOVA.email)
    await dialog.getByLabel('Senha', { exact: true }).fill('Kurio@2026')
    await dialog.getByLabel('Confirmar senha').fill('Kurio@2026')
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    await expect(dialog.getByText('Este e-mail já está em uso.')).toBeVisible()

    await dialog.getByLabel('E-mail').fill('camila@kurio.test')
    await dialog.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  })

  test('perfil: salva o nome e o cabeçalho reflete a mudança', async ({ page }) => {
    await login(page, '/profile')
    const name = page.getByLabel(/Nome de exibição/)
    await name.fill('Nova Silva')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText('Perfil atualizado.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Meu perfil, Nova Silva' }).first()).toBeAttached()
  })

  test('carteiras: edita o apelido da carteira principal', async ({ page }) => {
    await login(page, '/profile/wallets')
    const form = page.getByRole('form', { name: 'Carteira principal' })
    await form.getByLabel(/Apelido da carteira/).fill('Cofre frio')
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira principal salva.')).toBeVisible()

    await page.reload()
    await expect(
      page.getByRole('form', { name: 'Carteira principal' }).getByLabel(/Apelido da carteira/),
    ).toHaveValue('Cofre frio')
  })

  test('sessão expirada em tela privada leva ao login e volta ao destino', async ({ page }) => {
    test.setTimeout(60_000)
    await open(page, '/login?redirect=%2Fprofile', 'expired-session')
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('E-mail').fill(NOVA.email)
    await dialog.getByLabel('Senha', { exact: true }).fill(NOVA.password)
    await dialog.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()

    await page.waitForTimeout(16_000)
    await page.getByLabel(/Nome de exibição/).fill('Nova Expirada')
    await page.getByRole('button', { name: 'Salvar' }).click()

    await expect(page).toHaveURL(/\/login\?redirect=%2Fprofile/)
    await expect(
      page.getByText('Sua sessão expirou. Entre novamente para continuar.'),
    ).toBeVisible()
  })
})

test.describe('Compra', () => {
  test('compra completa: pagamento, pedido pendente e recibo', async ({ page }) => {
    await buyUntilCheckout(page)
    await confirmPurchase(page)

    await expect(page).toHaveURL(/\/orders\/ord_/)
    await expect(
      page.getByRole('heading', { name: 'Aguardando a confirmação na rede' }),
    ).toBeVisible()
    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('link', { name: 'Ver no Etherscan' })).toBeVisible()

    await page.getByRole('link', { name: 'Fechar recibo e voltar ao início' }).click()
    await expect(page.getByRole('link', { name: /^Carrinho$/ }).first()).toBeAttached()
  })

  test('recarregar com pedido pendente retoma o acompanhamento', async ({ page }) => {
    await buyUntilCheckout(page)
    await confirmPurchase(page)
    await expect(page).toHaveURL(/\/orders\/ord_/)

    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/orders\/ord_/)
    await page.reload()

    await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 15_000,
    })
  })

  test('pagamento recusado explica o motivo e mantém o carrinho', async ({ page }) => {
    await buyUntilCheckout(page, 'payment-rejected')
    await confirmPurchase(page)

    await expect(
      page.getByRole('heading', { name: 'Não foi possível concluir a compra' }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('alert')).toContainText('Seus NFTs continuam no carrinho')
  })

  test('preço que muda no pagamento exige conferência antes de comprar', async ({ page }) => {
    await buyUntilCheckout(page, 'checkout-price-change')
    await confirmPurchase(page)

    await expect(page.getByText('Os valores mudaram desde a última conferência')).toBeVisible()
    await page.getByRole('button', { name: 'Ver novos valores' }).click()
    await page.getByRole('button', { name: 'Aceitar novo preço' }).click()
    await expect(page.getByRole('button', { name: 'Aceitar novo preço' })).toBeHidden()
    await confirmPurchase(page)

    await expect(page).toHaveURL(/\/orders\/ord_/)
  })

  test('carteira que recusa a conexão não cria pedido', async ({ page }) => {
    await buyUntilCheckout(page, 'wallet-refused')
    await confirmPurchase(page)

    await expect(page.getByText('A carteira recusou a conexão')).toBeVisible()
    await expect(page).toHaveURL(/\/checkout$/)
  })
})

test.describe('Navegação inferior (mobile)', () => {
  test('aparece no mobile, foca a busca e some no pagamento', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'A barra inferior existe só no mobile.')

    await open(page, NFT_PATH)
    const bar = page.getByRole('navigation', { name: 'Navegação inferior' })
    await expect(bar).toBeVisible()

    await bar.getByRole('button', { name: 'Buscar NFTs' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('main').getByRole('searchbox').first()).toBeFocused()

    await buyUntilCheckout(page)
    await expect(bar).toBeHidden()
  })

  test('no desktop a barra inferior não existe', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Só no desktop.')

    await open(page, '/')
    await expect(page.getByRole('navigation', { name: 'Navegação inferior' })).toHaveCount(0)
  })
})

test.describe('Acessibilidade básica', () => {
  test('o login abre como diálogo e prende o foco', async ({ page }) => {
    await open(page, '/login')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    for (let index = 0; index < 12; index += 1) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') !== null,
      )
      expect(inside).toBe(true)
    }
  })

  test('tudo que recebe foco no detalhe tem indicador visível', async ({ page }) => {
    await open(page, NFT_PATH)
    await page.getByRole('heading', { level: 1 }).click()

    for (let step = 0; step < 24; step += 1) {
      await page.keyboard.press('Tab')
      const indicator = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return 'ok'
        const visible = (target: Element) => {
          const style = getComputedStyle(target)
          const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
          const hasRing = /\) 0px 0px 0px [1-9]\d*px/.test(style.boxShadow)
          return hasOutline || hasRing
        }
        // Cards e campos compostos mostram o foco no contêiner (article / focus-within).
        let target: Element | null = el
        for (let depth = 0; depth < 4 && target; depth += 1) {
          if (visible(target)) return 'ok'
          target = target.parentElement
        }
        return `${el.tagName} ${el.getAttribute('aria-label') ?? el.textContent.slice(0, 30)}`
      })
      expect(indicator, 'elemento focado sem indicador visível').toBe('ok')
    }
  })
})
