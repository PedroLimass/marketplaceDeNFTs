# Kurio — Marketplace de NFTs

Marketplace de descoberta, compra e conta do colecionador. APIs, sessão, carteiras, pedidos e
tempo real são simulados com MSW e Socket.IO. Não há blockchain nem pagamento real. Um checkout
limpo sobe sem backend externo.

**Stack:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, Axios, Socket.IO, Tailwind
CSS, shadcn/ui, MSW, Playwright e Lighthouse.

## Onde ler

| Documento                                  | O que responde                                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Este README                                | Instalar, rodar, testar, escolher cenários e reproduzir falhas                                                    |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)     | Camadas, sessão, carrinho, cache, REST × Socket.IO, Lighthouse, limitações e desvios do Figma                     |
| [`docs/CONTRATOS.md`](./docs/CONTRATOS.md) | Contratos REST, códigos de erro, eventos, idempotência, fixtures e decisões de contrato já aplicadas na aplicação |

## Setup

Node 22+ e [pnpm](https://pnpm.io/) 12.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Abra `http://localhost:5173`. Os mocks já vêm ligados. Enquanto o Service Worker do MSW sobe, a
página mostra o casco de carregamento (wordmark, cabeçalho e o espaço do hero). O motivo está em
[`ARCHITECTURE.md`](./ARCHITECTURE.md#casco-de-carregamento-antes-do-react).

## Contas de demonstração

No mock a senha fica só como salt e hash, nunca em claro.

| Conta      | E-mail              | Senha        | Carteiras                                                         |
| ---------- | ------------------- | ------------ | ----------------------------------------------------------------- |
| Nova Alves | `nova@kurio.test`   | `Kurio@2026` | Principal (MetaMask, Ethereum) e Reserva (WalletConnect, Polygon) |
| Rafael     | `rafael@kurio.test` | `Kurio@2026` | Só a principal                                                    |

Cupons no carrinho: `LANCAMENTO10` (10%), `EXPIRADO` e `INVALIDO`.

## Variáveis de ambiente

| Variável             | Padrão    | Função                                     |
| -------------------- | --------- | ------------------------------------------ |
| `VITE_API_BASE_URL`  | `/api`    | Prefixo REST; o MSW intercepta             |
| `VITE_SOCKET_URL`    | `/`       | Origem do Socket.IO                        |
| `VITE_ENABLE_MOCKS`  | `true`    | Liga MSW no dev e no build de demonstração |
| `VITE_MOCK_SCENARIO` | `default` | Cenário inicial (a URL tem prioridade)     |

O build publicado precisa de `VITE_ENABLE_MOCKS=true`. Sem isso as rotas `/api` não existem.

## Cenários e reset

Precedência: `?scenario=<id>` na URL, depois o valor da sessão, depois `VITE_MOCK_SCENARIO`.

No console do navegador (só com mocks ativos):

```js
window.__mockControl.scenarios // lista
window.__mockControl.getScenario()
window.__mockControl.setScenario('offline') // recarrega do zero
window.__mockControl.applyScenario('server-error') // só as próximas requisições
window.__mockControl.reset() // banco inicial + reload

// Tempo real (a UI só reage ao socket, nunca a estes setters)
window.__mockControl.setNftPrice('emerald-ape-042', '1.45')
window.__mockControl.setNftStock('emerald-ape-042', '1/50', 0)
window.__mockControl.resolveOrder('ord_…')
window.__mockControl.disconnectSockets()
window.__mockControl.replayLastEvent()
window.__mockControl.sendStaleNftEvent('emerald-ape-042')
```

| Cenário                 | O que acontece                                                   |
| ----------------------- | ---------------------------------------------------------------- |
| `default`               | Sucesso. Pedido pendente confirma em 2 s                         |
| `empty`                 | Catálogo vazio                                                   |
| `slow-network`          | 2,5 s em toda rota (skeletons)                                   |
| `out-of-order`          | `GET /nfts` ímpares atrasam                                      |
| `flaky`                 | As 2 primeiras chamadas de cada rota falham                      |
| `offline`               | Erro de rede                                                     |
| `server-error`          | `503` nas leituras; `500` em `PUT /favorites`                    |
| `timeout`               | `GET /nfts` não responde a tempo                                 |
| `expired-session`       | Token vence em 15 s                                              |
| `unauthorized`          | `403` nas rotas privadas                                         |
| `signup-conflict`       | Cadastro responde `409 email_taken`                              |
| `invalid-coupon`        | Todo cupom é recusado                                            |
| `checkout-price-change` | O preço muda na hora de criar o pedido                           |
| `checkout-sold-out`     | A edição esgota na hora de criar o pedido                        |
| `order-timeout`         | O pedido é criado, a resposta chega depois do timeout do cliente |
| `payment-rejected`      | O pedido pendente vira recusado                                  |
| `wallet-refused`        | A carteira recusa a conexão                                      |

O banco do mock fica no `localStorage` (`kurio.mock-db`). `reset()` ou
`localStorage.removeItem('kurio.mock-db')` + reload volta ao estado inicial.

## Comandos

Desenvolvimento e build:

```bash
pnpm dev        # http://localhost:5173, com mocks
pnpm build      # verificação de tipos e bundle em dist/
pnpm preview    # serve o build
pnpm typecheck
pnpm lint
pnpm format
```

Testes. Os de unidade não abrem o navegador. Os de ponta a ponta usam o Chromium do Playwright,
nos viewports desktop (1280×900) e mobile (Pixel 7), e observam a interface:

```bash
pnpm test             # Vitest
pnpm test:coverage    # texto, HTML e lcov em coverage/
pnpm exec playwright install chromium
pnpm e2e              # build, preview e Playwright
pnpm e2e:update       # atualiza as baselines visuais versionadas
```

`pnpm e2e` grava trace e relatório HTML quando um teste falha (`playwright-report/`,
`test-results/`). Cada teste parte de um estado isolado.

Auditoria. O preview do Lighthouse serve o `dist/`, então o build vem antes. São três rodadas de
Início e Detalhe, em mobile e desktop; a mediana fica em `lighthouse-report/summary.json`, com o
HTML e o JSON da última rodada ao lado.

```bash
pnpm build && pnpm lighthouse
```

## Reproduzir falhas

1. **Catálogo vazio / lento / fora de ordem:** `/?scenario=empty`, `slow-network`, `out-of-order`.
2. **Rede e 5xx:** `/?scenario=offline` ou `server-error`; no detalhe, Favoritar com `server-error`
   faz rollback do coração.
3. **Sessão expirada:** entre com `/?scenario=expired-session`, espere 15 s e salve o perfil ou
   confirme uma compra. A tela privada volta ao login com o destino.
4. **Cupom:** no carrinho, `INVALIDO` ou `EXPIRADO`; ou `?scenario=invalid-coupon`.
5. **Preço / estoque em tempo real:** coloque o Emerald Ape no carrinho e, no console,
   `setNftPrice('emerald-ape-042', '1.45')`. O aviso aparece e o pagamento bloqueia até aceitar.
6. **Checkout:** `?scenario=checkout-price-change` ou `checkout-sold-out` na hora de confirmar.
7. **Carteira recusada:** `?scenario=wallet-refused` e "Confirmar compra".
8. **Carteira desconectada:** no pagamento, "Desconectar" bloqueia "Confirmar compra" até
   "Conectar".
9. **Pagamento recusado:** `?scenario=payment-rejected`; o carrinho permanece.
10. **Timeout do pedido:** `?scenario=order-timeout`. A primeira confirmação estoura os 10 s; a
    segunda reenvia a mesma `Idempotency-Key` e recupera o pedido já criado.
11. **Cadastro em conflito:** `?scenario=signup-conflict` ou use `nova@kurio.test` de novo.

## Telas

| Rota                           | Acesso                                      |
| ------------------------------ | ------------------------------------------- |
| `/`                            | Catálogo                                    |
| `/nfts/:id`                    | Detalhe                                     |
| `/cart`                        | Carrinho (visitante ou conta)               |
| `/checkout`                    | Pagamento (conta)                           |
| `/orders/:id`                  | Pedido pendente, recusado ou recibo (conta) |
| `/login`, `/signup`            | Modal; `?redirect=` volta ao destino        |
| `/profile`, `/profile/wallets` | Conta                                       |

Abaixo de 768 px há barra inferior (Início, Carrinho, busca, Perfil/Entrar). Pagamento e recibo
não a mostram.

## Deploy

A URL pública deve servir o mesmo build, com mocks e Socket.IO ativos, e o fallback de SPA para
refresh em qualquer rota. Há um `vercel.json` com o rewrite e os cabeçalhos do Service Worker.

```bash
pnpm build
# Vercel / Netlify / Cloudflare Pages apontando para `dist`
# Build command: pnpm build
# Variável de build: VITE_ENABLE_MOCKS=true
```
