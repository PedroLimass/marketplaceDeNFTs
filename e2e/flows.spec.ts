import { expect, test, type Page } from '@playwright/test'

import {
  NOVA,
  addToCartFromDetail,
  confirmPurchase,
  login,
  open,
  startCheckout,
} from './support/app'

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

  test('altera a quantidade e remove o item', async ({ page }) => {
    await open(page, NFT_PATH)
    await page.getByRole('button', { name: 'Comprar' }).click()
    const cart = page.getByRole('main')
    await expect(cart.getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()

    await cart.getByRole('button', { name: /Aumentar quantidade/ }).click()
    await expect(cart.getByRole('group', { name: /Quantidade de/ })).toContainText('2')

    await cart.getByRole('button', { name: /Remover Emerald Ape #042/ }).click()
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })

  test('aplica cupom válido, remove e recusa o expirado', async ({ page }) => {
    await open(page, NFT_PATH)
    await page.getByRole('button', { name: 'Comprar' }).click()
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Emerald Ape #042' }),
    ).toBeVisible()

    const input = page.getByLabel('Código promocional')
    await input.fill('lancamento10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('LANCAMENTO10', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: /Remover cupom/ }).click()
    await expect(page.getByText('Cupom removido.')).toBeVisible()

    await input.fill('EXPIRADO')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Este cupom expirou.' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()
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

  test('perfil: valida senha, troca a senha e o avatar', async ({ page }) => {
    await login(page, '/profile')

    await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('Nova@2027x')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Informe a senha atual.')).toBeVisible()

    await page.getByLabel('Senha atual').fill('Kurio@2026')
    await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('Nova@2027x')
    await page.getByLabel('Confirmar nova senha').fill('Nova@2027x')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Senha alterada.')).toBeVisible()

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    )
    await page.getByLabel('Arquivo do avatar').setInputFiles({
      name: 'nota.gif',
      mimeType: 'image/gif',
      buffer: png,
    })
    await expect(page.getByText('Use uma imagem JPG, PNG ou WebP.')).toBeVisible()

    await page.getByLabel('Arquivo do avatar').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: png,
    })
    await expect(page.getByText('Avatar atualizado.')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
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
    await form.getByLabel(/Apelido da carteira/).fill('')
    await form.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(form.getByText('Informe um apelido para a carteira.')).toBeVisible()

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

  test('edição esgotada na confirmação não cria pedido', async ({ page }) => {
    await buyUntilCheckout(page, 'checkout-sold-out')
    await confirmPurchase(page)

    await expect(page.getByText('Alguns itens não estão mais disponíveis')).toBeVisible()
    await expect(page).toHaveURL(/\/checkout$/)
  })

  test('cliques repetidos não criam um segundo pedido', async ({ page }) => {
    await buyUntilCheckout(page)
    const keys: string[] = []
    page.on('request', (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/orders')) {
        keys.push(request.headers()['idempotency-key'] ?? '')
      }
    })

    const button = page.getByRole('button', { name: 'Confirmar compra' })
    await expect(button).toBeEnabled()
    await button.evaluate((element: HTMLButtonElement) => {
      element.click()
      element.click()
      element.click()
    })

    await expect(page).toHaveURL(/\/orders\/ord_/)
    expect(new Set(keys.filter(Boolean)).size).toBeLessThanOrEqual(1)
  })

  test('desconectar a carteira bloqueia a compra até conectar de novo', async ({ page }) => {
    await buyUntilCheckout(page)
    const summary = page.getByRole('complementary', { name: 'Seus NFTs' })

    await summary.getByRole('button', { name: 'Desconectar' }).click()
    await expect(summary.getByRole('status')).toHaveText('Carteira desconectada')
    await expect(summary.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()
    await expect(summary.getByText('Conecte a carteira para continuar.')).toBeVisible()

    await summary.getByRole('button', { name: 'Conectar' }).click()
    await expect(summary.getByRole('status')).toHaveText('Carteira conectada')
    await expect(summary.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
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

test.describe('Catálogo (filtros e detalhe)', () => {
  test('filtros combinados e ordenação entram na URL e sobrevivem ao refresh', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Ordenação do toolbar é desktop.')
    await open(page, '/')

    await page.getByRole('button', { name: /Arte digital/ }).click()
    await page.getByRole('button', { name: /Ethereum/ }).click()
    await expect(page).toHaveURL(/category=arte-digital/)
    await expect(page).toHaveURL(/network=ethereum/)

    await page.getByRole('button', { name: /Ordenar por/ }).click()
    await page.getByRole('menuitemradio', { name: 'Menor preço' }).click()
    await expect(page).toHaveURL(/sort=price-asc/)

    await page.reload()
    await expect(page.getByRole('button', { name: /Arte digital/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByRole('button', { name: /Ordenar por/ })).toContainText('Menor preço')
  })

  test('acesso direto a um NFT inexistente mostra o estado vazio', async ({ page }) => {
    await open(page, '/nfts/nao-existe')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  })
})

test.describe('Favoritos e sessão entre usuários', () => {
  test('favoritar falha e o coração volta ao estado anterior', async ({ page }) => {
    await login(page, '/nfts/emerald-ape-042', NOVA)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await page.evaluate(() => {
      window.__mockControl?.applyScenario('server-error')
    })

    const favorite = page.getByRole('button', { name: /^Favoritar/ })
    await favorite.click()
    await expect(page.getByText('Não foi possível adicionar aos favoritos')).toBeVisible()
    await expect(favorite).toBeVisible()
    await expect(favorite).toHaveAttribute('aria-pressed', 'false')
  })

  test('trocar de usuário isola o carrinho', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await addToCartFromDetail(page)
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()

    await page.getByRole('banner').getByRole('button', { name: 'Sair' }).click()
    await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
    await login(page, '/cart', { email: 'rafael@kurio.test', password: 'Kurio@2026' })

    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })
})

test.describe('Pedido com timeout e carregamento lento', () => {
  test('timeout na criação recupera o mesmo pedido ao reenviar', async ({ page }) => {
    test.setTimeout(60_000)
    await buyUntilCheckout(page, 'order-timeout')
    await confirmPurchase(page)

    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: 25_000 })
    await expect(
      page.getByRole('heading', {
        name: /Aguardando a confirmação na rede|Seus NFTs agora estão na sua carteira/,
      }),
    ).toBeVisible()
  })

  test('rede lenta mostra skeleton e depois o catálogo', async ({ page }) => {
    await open(page, '/', 'slow-network')
    await expect(page.getByText('Carregando NFTs…')).toBeAttached()
    await expect(page.getByText(/NFTs encontrados\. Página 1 de/)).toBeVisible({ timeout: 15_000 })
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
