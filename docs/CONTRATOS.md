# Contratos REST, eventos e dados simulados

> **Status:** rascunho para revisão. Nenhum mock ou handler foi escrito ainda.
>
> **Fontes:** o enunciado (`docs/DESAFIO.md`) e o arquivo do Figma duplicado
> (`XHIySDsV2teGC6LjYTTmLM`). Os dados da seção 1 foram lidos das camadas de texto dos frames, então
> nomes e valores abaixo são os do design, não inventados. O que foi inventado está marcado como
> **(definido aqui)**.

Este documento vira a base do `ARCHITECTURE.md` e das fixtures do MSW. A marca do produto é
**Kurio** (hero, wordmark mobile); "GreenMint" é só o nome da página no Figma.

---

## 1. O que o Figma nos dá

### 1.1 Catálogo

A grade da tela Início tem 3 colunas de cards de 258 px e paginação `1 2 3 4`. Isso sugere **9 NFTs por
página e 36 no total** (a confirmar com a captura de tela na hora de implementar).

| NFT                   | Token  | Preço (ETH) | Onde aparece                                                                                |
| --------------------- | ------ | ----------- | ------------------------------------------------------------------------------------------- |
| Emerald Ape #042      | `0042` | 1.19        | Grade, detalhe, carrinho, recibo. Badge `RARO` no mobile                                    |
| Sage Nomad #009       | `0009` | 1.69        | Grade                                                                                       |
| Neon Vessel #552      | `0552` | 1.99        | Grade, em oferta (preço anterior `2.29` ao lado)                                            |
| Cosmic Bloom #118     | `0118` | 1.29        | Grade, "Mais desta coleção", "Colecionadores também viram"                                  |
| Violet Nomad #314     | `0314` | 1.39        | Grade, carrinho, recibo                                                                     |
| Ivory Baron #088      | `0088` | 1.79        | Grade, carrinho, recibo                                                                     |
| Golden Beat #207      | `0207` | 0.99        | Grade, carrinho mobile                                                                      |
| Golden Frequency #071 | `0071` | 0.59        | Grade, card do meio da última linha (sem texto no Figma; nome e preço vêm da tela de login) |
| Golden Signal #160    | `0160` | 0.39        | Grade                                                                                       |

O vocabulário de nomes (cor/adjetivo + substantivo + `#NNN`) permite gerar os 27 NFTs restantes de
forma determinística **(definido aqui)**. Adjetivos: Emerald, Sage, Neon, Cosmic, Violet, Ivory,
Golden. Substantivos: Ape, Nomad, Vessel, Bloom, Baron, Beat, Signal.

### 1.2 Filtros, abas e ordenação

- **Abas:** `Todos os NFTs`, `Novos lançamentos`, `Em alta`.
- **Ordenação:** o padrão é `Listados recentemente`. As demais opções não aparecem no design
  **(definido aqui):** `recent`, `price-asc`, `price-desc`, `name`.
- **Coleções (filtro):** 9 linhas com contagens `33, 12, 65, 39, 23, 17, 19, 13, 18`. O metadado
  traz o texto padrão do componente (`Digital Art, Photography, Music, 3D Art, Collectibles,
Generative, Gaming, Memberships`), então os rótulos reais devem ser confirmados na captura.
- **Preço:** slider com o texto `Preço: 0,02 - 12,30 ETH` e botão `Aplicar`. As fixtures devem ter
  um NFT a 0.02 e outro a 12.30.
- **Rede:** `Ethereum (119)`, `Polygon (78)`, `Solana (86)`.
- **Destaque:** o banner lateral "NFT EM DESTAQUE / OFERTA LIMITADA".
- **Selos nos cards:** `RARO`.

### 1.3 Detalhe do NFT (Emerald Ape #042)

- Breadcrumb `Início / Mercado`, preço `1.19 ETH`, `19 avaliações de colecionadores`, nota **4.8**
  (mobile).
- **Edição:** três opções `1/1`, `1/10`, `1/50` e o status `ABERTA`.
- Quantidade (padrão 1), botões `COMPRAR` e `Favoritar`, compartilhar.
- Metadados: `ID do token #0042`, `Coleção: Kurio Apes`, `Atributos: Óculos, Esmeralda, Raro`.
- Criadora **Nova Sato**, com **5% de royalties** em vendas secundárias.
- Contrato `0x7A42...19E8`, padrão ERC-721, rede Ethereum, metadados no IPFS.
- Seções "Detalhes do NFT", "Avaliações de colecionadores (19)" e "Mais desta coleção".

### 1.4 Carrinho e cotação

Itens do desktop e conferência dos números:

| Item              | Preço | Qtd | Total |
| ----------------- | ----- | --- | ----- |
| Emerald Ape #042  | 1.19  | 2   | 2.38  |
| Violet Nomad #314 | 1.39  | 6   | 8.34  |
| Ivory Baron #088  | 1.79  | 9   | 16.11 |

Subtotal **26.83** + taxa de rede **0.016** = **26.846 ETH**. A conta fecha, então este cenário
vira o **preset `figma`** para os testes de regressão visual.

Elementos: campo de cupom (`Digite o código promocional...` + `Aplicar`), linha `Desconto do
lançamento` (`(-) 00.00`), `Taxa de rede`, `Total`, `Conectar e finalizar`, `Continuar explorando`
e a faixa "Colecionadores também viram".

### 1.5 Pagamento, pedido e recibo

**Formulário "Perfil do colecionador" (desktop):** `Nome de exibição*`, `Rede*`, `Endereço da
carteira*`, `Tipo de carteira*`, `E-mail*`, `Nome de usuário*`, `Nome do perfil*`, `ENS ou carteira
secundária (opcional)`, `Código de indicação*`, `Nome ENS*` (sufixo `.eth`), opção `Usar outra
carteira?` e `Observação do colecionador (opcional)`.

**Resumo lateral:** os itens com `(x N)` e o subtotal de cada um, o link "Tem um código promocional?
Aplique aqui", e a lista de carteiras (`MetaMask`, `Coinbase Wallet`, `WalletConnect`) com o botão
`Confirmar compra`. O nó se chama "Page Content (behind overlay)", ou seja, existe um overlay por
cima (provavelmente a conexão da carteira ou a revisão). **Ainda não vimos esse overlay.**

**Mobile:** `Carteira conectada` com `Trocar carteira`; a carteira `Principal` (`0xA91F…E82C`,
Ethereum Mainnet) e a `Reserva` (`nova.kurio.eth`, Polygon).

**Recibo:** "Seus NFTs agora estão na sua carteira", `ID da transação 0xA91F…E82C`, data `29 Jul,
2026`, total `26.846 ETH`, carteira `MetaMask`, tabela de NFTs com `(x N)`, taxa de rede, `Ver no
Etherscan`.

### 1.6 Conta

- **Login:** campos e-mail e senha, `Esqueceu a senha?`, `Ou continue com` (botões sociais).
- **Cadastro:** `Nome de usuário`, e-mail, senha, confirmar senha.
- **Perfil:** `Nome de exibição`, `Nome de usuário`, `E-mail`, `Nome ENS`, `Apelido da carteira`,
  avatar (`Remover` / `Alterar`) e troca de senha (`Senha atual`, `Nova senha`, `Confirmar`).
- **Carteiras:** `Carteira principal` e `Carteira secundária` (opção `Igual à carteira principal`).
  Campos: `Rede`, `Endereço 0x`, `Tipo de carteira`, `Apelido`, `Nome ENS`, entre outros.
- **Fora do escopo** (menu do perfil): Activity, Watchlist, Offers, Downloads, Support. Redes
  sociais, "Diário da Cunhagem" (blog) e rodapé também.

### 1.7 Inconsistências do Figma e decisão tomada

| #   | O que o Figma mostra                                                                                           | Decisão                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | No carrinho, Violet Nomad #314 tem token `#0009` e Ivory Baron #088 tem `#0552`. No recibo são `#0314`/`#0088` | O token é o número do nome com 4 dígitos. Os valores do carrinho são cópia de outros cards |
| 2   | Carrinho mobile: subtotal `8.92` não bate com os itens exibidos                                                | Os totais são sempre **calculados** a partir dos itens, nunca copiados do design           |
| 3   | Contagens do filtro de Coleções somam 239 e as de Rede somam 283                                               | Facetas calculadas pela API a partir das fixtures, com os mesmos rótulos                   |
| 4   | O filtro de preço usa vírgula (`0,02`); todo o resto usa ponto (`1.19 ETH`)                                    | Ponto em tudo, por consistência. Registrar como desvio no `ARCHITECTURE.md`                |
| 5   | `ID da transação` do recibo é igual ao endereço da carteira (`0xA91F…E82C`)                                    | Gerar um hash de transação próprio, exibido abreviado no mesmo formato                     |
| 6   | Edição `1/1` com quantidade > 1 no carrinho (Violet Nomad, 6 unidades)                                         | A edição é um **lote** com `supply` e `available`. A quantidade é limitada por `available` |
| 7   | `Código de indicação*` e `Nome ENS*` marcados como obrigatórios, mas parecem herança de modelo                 | Decidir campo a campo na tela de pagamento (seção 9)                                       |
| 8   | Não há frames mobile de Confirmação, Perfil e Carteiras                                                        | O enunciado exige que funcionem; seguem o mesmo padrão visual                              |

---

## 2. Convenções

| Tema         | Regra                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Prefixo      | `/api` (variável `VITE_API_BASE_URL`)                                                                                 |
| Formato      | JSON em `snake_case` no transporte. Mappers convertem para `camelCase` no estado/UI                                   |
| ETH          | Sempre **string decimal** (`"1.19"`), nunca `number`. Quantidades são inteiros                                        |
| Datas        | ISO 8601 em UTC                                                                                                       |
| IDs          | `id` de NFT é um slug (`emerald-ape-042`). Pedidos e cotações usam `ord_`/`qte_` + UUID                               |
| Versão       | Todo recurso que muda em tempo real tem `version` inteiro e monotônico                                                |
| Autenticação | `Authorization: Bearer <access_token>`                                                                                |
| Visitante    | Header `X-Guest-Id: <uuid>`, gerado no cliente e guardado em `localStorage`. Ignorado quando há sessão                |
| Erros        | `{ "error": { "code", "message", "fieldErrors?", "details?" } }` (já implementado em `infrastructure/http/errors.ts`) |
| Cancelamento | Todo `queryFn` repassa o `signal` ao Axios                                                                            |

**Mapeamento de erros** (HTTP, `kind` do `ApiError`, códigos usados):

| HTTP         | `kind`                | `code`                                                                                                |
| ------------ | --------------------- | ----------------------------------------------------------------------------------------------------- |
| 400 / 422    | `validation`          | `validation_failed`, `coupon_invalid`, `coupon_expired`, `invalid_current_password`                   |
| 401          | `unauthorized`        | `unauthenticated`, `invalid_credentials`, **`session_expired`** (dispara a limpeza de sessão)         |
| 403          | `forbidden`           | `forbidden`, `wallet_connection_refused`                                                              |
| 404          | `not_found`           | `nft_not_found`, `order_not_found`                                                                    |
| 409          | `conflict`            | `email_taken`, `username_taken`, `insufficient_availability`, `quote_stale`, `idempotency_key_reused` |
| 429 / 5xx    | `transient`           | `service_unavailable`                                                                                 |
| sem resposta | `network` / `timeout` | produzidos no cliente, pelo MSW (`HttpResponse.error()` ou resposta que não chega)                    |

---

## 3. Endpoints

`Auth` = exige sessão. `Opcional` = funciona com sessão ou como visitante.

### 3.1 Sessão e conta

| Método e rota         | Acesso   | Corpo / resposta                                                                                                            |
| --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/register` | Público  | `{ username, email, password }` -> `201 { user, access_token, expires_at }`. Conflito: `409 email_taken` / `username_taken` |
| `POST /auth/login`    | Público  | `{ email, password }` -> `200` igual ao cadastro. Erro: `401 invalid_credentials`                                           |
| `GET /auth/session`   | Opcional | Visitante: `200 { user: null }`. Logado: `200 { user, expires_at }`. Token vencido: `401 session_expired`                   |
| `POST /auth/logout`   | Auth     | `204`. Invalida o token                                                                                                     |

Detalhes:

- O token é opaco e fica em `localStorage` (`kurio.session`). Cookie `HttpOnly` não é viável porque um
  Service Worker não pode definir `Set-Cookie`. Essa limitação vai para o `ARCHITECTURE.md`.
- Senhas nunca ficam em claro: o banco do mock guarda hash PBKDF2 com sal (WebCrypto). O cliente
  nunca persiste a senha.
- Sem refresh token; a sessão dura 30 min por padrão (definido aqui) e o cenário `expired-session`
  a encurta.
- Visitante recebe `200 { user: null }` para não poluir o console com 401 em toda abertura do app.

### 3.2 NFTs

| Método e rota        | Acesso  | Descrição                                          |
| -------------------- | ------- | -------------------------------------------------- |
| `GET /nfts`          | Público | Listagem com busca, filtros, ordenação e paginação |
| `GET /nfts/featured` | Público | NFT em destaque e itens "em alta" para a Home      |
| `GET /nfts/:id`      | Público | Detalhe. `404 nft_not_found` se não existir        |

**Parâmetros de `GET /nfts`** (repetem chave para múltiplos valores, como `category=a&category=b`):

| Parâmetro                | Valores                                                   |
| ------------------------ | --------------------------------------------------------- |
| `q`                      | texto livre (nome, token, coleção)                        |
| `category`               | id de categoria, o filtro "Coleções" do design (múltiplo) |
| `collection`             | id da coleção/série do NFT, ex. `kurio-apes` (único)      |
| `network`                | `ethereum`, `polygon`, `solana` (múltiplo)                |
| `min_price`, `max_price` | strings decimais                                          |
| `listing`                | `all` (padrão), `new`, `trending` (as três abas)          |
| `sort`                   | `recent` (padrão), `price-asc`, `price-desc`, `name`      |
| `page`, `page_size`      | padrão `1` e `9`                                          |
| `exclude`                | id a omitir (usado em "Mais desta coleção")               |

**Resposta da listagem:**

```json
{
  "items": [
    {
      "id": "emerald-ape-042",
      "token_id": "0042",
      "name": "Emerald Ape #042",
      "price_eth": "1.19",
      "previous_price_eth": null,
      "image_url": "/assets/nfts/art-1.webp",
      "thumbnail_url": "/assets/nfts/art-1-500.webp",
      "collection": { "id": "kurio-apes", "name": "Kurio Apes" },
      "category": { "id": "arte-digital", "name": "Arte digital" },
      "network": "ethereum",
      "badge": "rare",
      "status": "open",
      "available_quantity": 50,
      "version": 3
    }
  ],
  "page": 1,
  "page_size": 9,
  "total": 36,
  "total_pages": 4,
  "facets": {
    "categories": [{ "id": "arte-digital", "name": "Arte digital", "count": 5 }],
    "networks": [{ "id": "ethereum", "name": "Ethereum", "count": 12 }],
    "price_range": { "min_eth": "0.02", "max_eth": "12.30" }
  }
}
```

`badge` é `"rare" | "limited" | null` e `status` é `"open" | "sold_out"`. `previous_price_eth` é o
preço antes da oferta (a Neon Vessel #552 mostra `1.99` com `2.29` ao lado) ou `null`.

**Facetas.** O filtro lateral do design é "Coleções", mas seus itens (Arte digital, Música...) são
**categorias**; a "Coleção" do detalhe (Kurio Apes) é a série do NFT. Por isso o contrato separa
`category` e `collection`. As contagens do design (33, 12, 65... e 119/78/86) somam mais que os 36 NFTs
do catálogo, então as facetas são **calculadas a partir dos dados**: cada contagem respeita todos os
filtros ativos, menos o da própria faceta. `price_range` é sempre o intervalo do catálogo inteiro.

**`GET /nfts/featured`** devolve `{ featured: <resumo>, trending: <resumo>[] }` (até 4 em alta).

**Detalhe** acrescenta ao resumo: `description`, `gallery[{ url, alt }]`,
`editions[{ id: "1/50", label, supply, available, status }]`, `attributes: string[]`,
`creator { name, royalty_percent }`, `contract { address, standard, network, metadata_uri }`,
`rating { average, count }` e `max_per_order` (10, definido aqui).

### 3.3 Favoritos

| Método e rota              | Acesso | Resposta                |
| -------------------------- | ------ | ----------------------- |
| `GET /favorites`           | Auth   | `{ nft_ids: string[] }` |
| `PUT /favorites/:nftId`    | Auth   | `204`. Idempotente      |
| `DELETE /favorites/:nftId` | Auth   | `204`. Idempotente      |

A atualização é **otimista com rollback** (é a interação obrigatória do enunciado). O cenário
`server-error` aplicado a `PUT` exercita o rollback.

### 3.4 Carrinho

| Método e rota                | Acesso   | Descrição                                                      |
| ---------------------------- | -------- | -------------------------------------------------------------- |
| `GET /cart`                  | Opcional | Itens do usuário ou do visitante (`X-Guest-Id`)                |
| `POST /cart/items`           | Opcional | `{ nft_id, edition_id, quantity }`. Soma se a linha já existir |
| `PATCH /cart/items/:itemId`  | Opcional | `{ quantity }`                                                 |
| `DELETE /cart/items/:itemId` | Opcional | `204`                                                          |
| `POST /cart/merge`           | Auth     | Une o carrinho do visitante ao do usuário logo após o login    |

- Excesso de quantidade responde `409 insufficient_availability` com `details.available`.
- Cada item traz o preço e a disponibilidade **atuais** e, se mudaram, `issues: [{ code, ... }]`.
- O carrinho **não** calcula totais; quem calcula é a cotação.
- No merge, as quantidades somam e são limitadas pela disponibilidade; a resposta lista os itens
  ajustados em `adjusted`.

### 3.5 Cotação

`POST /quotes` (opcional) cria um **snapshot** do carrinho com preços, cupom e taxas.

```json
// requisição
{ "coupon_code": "LANCAMENTO10", "network": "ethereum" }

// resposta 200
{
  "id": "qte_6f1c...",
  "cart_version": 12,
  "items": [
    {
      "nft_id": "emerald-ape-042",
      "edition_id": "1/50",
      "quantity": 2,
      "unit_price_eth": "1.19",
      "line_total_eth": "2.38",
      "nft_version": 3
    }
  ],
  "subtotal_eth": "26.83",
  "discount_eth": "0",
  "network_fee_eth": "0.016",
  "total_eth": "26.846",
  "coupon": null,
  "network": "ethereum",
  "issues": [],
  "expires_at": "2026-07-29T15:05:00Z"
}
```

- Cupom inválido ou vencido: `422 coupon_invalid` / `coupon_expired`, com `fieldErrors.coupon_code`.
- `issues` pode trazer `price_changed`, `sold_out` e `insufficient_availability`.
- O cliente exibe o `total_eth` da API; `calculateTotals` serve só para conferência e testes.

### 3.6 Pedidos

| Método e rota     | Acesso | Descrição                                                 |
| ----------------- | ------ | --------------------------------------------------------- |
| `POST /orders`    | Auth   | Cria o pedido. **Exige** o header `Idempotency-Key`       |
| `GET /orders/:id` | Auth   | Estado e recibo                                           |
| `GET /orders`     | Auth   | `?status=pending` recupera pedidos pendentes após refresh |

Corpo de `POST /orders`: `{ quote_id, wallet_id, network, collector: {...}, note? }`.

| Resultado                         | Resposta                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| Pedido criado                     | `202` com o pedido em `pending`                                                           |
| Mesma chave e mesmo corpo         | `200` com **o mesmo pedido** (recuperação após timeout)                                   |
| Mesma chave e corpo diferente     | `409 idempotency_key_reused`                                                              |
| Cotação desatualizada             | `409 quote_stale` com `details.quote` já recalculada. O usuário precisa confirmar de novo |
| Edição esgotada ou sem quantidade | `409 insufficient_availability`                                                           |
| Sessão vencida                    | `401 session_expired`                                                                     |

**Pedido** (e também o recibo):

```json
{
  "id": "ord_9a31...",
  "status": "pending",
  "version": 1,
  "items": [
    {
      "nft_id": "...",
      "name": "...",
      "token_id": "0042",
      "image_url": "...",
      "quantity": 2,
      "unit_price_eth": "1.19",
      "line_total_eth": "2.38"
    }
  ],
  "subtotal_eth": "26.83",
  "discount_eth": "0",
  "network_fee_eth": "0.016",
  "total_eth": "26.846",
  "network": "ethereum",
  "wallet": { "type": "metamask", "label": "MetaMask", "address": "0xA91F...E82C" },
  "transaction": null,
  "rejection": null,
  "created_at": "2026-07-29T14:58:00Z",
  "resolved_at": null
}
```

`status` é `pending | confirmed | rejected`. `confirmed` e `rejected` são **terminais**.
`transaction` (`hash`, `explorer_url`) só existe quando confirmado, e `rejection` (`code`, `message`)
só quando recusado. Os itens são um **snapshot**: mudar o catálogo depois não altera o recibo.

### 3.7 Perfil

| Método e rota            | Acesso | Descrição                                                                           |
| ------------------------ | ------ | ----------------------------------------------------------------------------------- |
| `GET /profile`           | Auth   | `{ display_name, username, email, ens_name, wallet_nickname, avatar_url }`          |
| `PATCH /profile`         | Auth   | Atualiza dados. `409` para e-mail/usuário já usados                                 |
| `PUT /profile/avatar`    | Auth   | `multipart/form-data`, JPG/PNG/WebP até 2 MB (definido aqui)                        |
| `DELETE /profile/avatar` | Auth   | `204`                                                                               |
| `POST /profile/password` | Auth   | `{ current_password, new_password }` -> `204`. Erro: `422 invalid_current_password` |

No mock, o avatar é redimensionado no cliente e guardado como data URL dentro do limite do
`localStorage`. Isso será documentado como limitação.

### 3.8 Carteiras

| Método e rota                  | Acesso | Descrição                                                                          |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------- |
| `GET /wallets`                 | Auth   | `{ items: Wallet[] }` com no máximo 2 itens (`role: "primary" \| "secondary"`)     |
| `PUT /wallets/:role`           | Auth   | Cadastra ou atualiza a carteira `primary` ou `secondary`                           |
| `POST /wallets/:id/connect`    | Auth   | Simula a conexão: `200 { status: "connected" }` ou `403 wallet_connection_refused` |
| `POST /wallets/:id/disconnect` | Auth   | `204`                                                                              |

`Wallet = { id, role, type, network, address, nickname, ens_name?, same_as_primary }`.
O endereço é validado (`0x` + 40 hexadecimais) e `type` é `metamask | walletconnect | coinbase`.
Conexão, recusa e desconexão passam por estes endpoints, para que **nenhuma lógica de mock fique em
componentes**.

---

## 4. Idempotência do pedido

A chave pertence à **tentativa de compra**, não ao clique.

1. Ao confirmar a revisão, o cliente gera `crypto.randomUUID()` e grava em `sessionStorage`
   (`checkout.attempt`): `{ key, quote_id, payload_hash, order_id? }`.
2. Cliques repetidos, timeouts e reenvios reutilizam **a mesma chave**. O botão fica desabilitado
   enquanto a mutation está em andamento.
3. O servidor guarda `chave -> { hash_do_corpo, pedido }` por 24 h (definido aqui). Com chave
   conhecida e hash igual devolve o mesmo pedido; com hash diferente responde `409`.
4. Uma **nova chave** só nasce quando o usuário confirma uma cotação diferente (após `quote_stale`)
   ou depois de um resultado terminal.
5. Depois de refresh ou reconexão, o cliente retoma pelo `order_id` salvo ou por
   `GET /orders?status=pending`, sem criar outra compra.
6. Ao confirmar, remove do carrinho **apenas** os itens e as quantidades comprados.

---

## 5. Tempo real (Socket.IO)

**Autenticação:** `io(url, { auth: { token }, transports: ["websocket"] })`. Logout ou troca de
usuário **desconecta** o socket, remove os listeners e limpa o cache privado; o novo login
reconecta com o novo token.

**Envelope comum:**

```json
{
  "event_id": "evt_01J...",
  "type": "nft.updated",
  "resource": { "type": "nft", "id": "emerald-ape-042" },
  "version": 4,
  "occurred_at": "2026-07-29T14:57:12Z",
  "data": {}
}
```

| Evento          | Alcance   | `data`                                                                     |
| --------------- | --------- | -------------------------------------------------------------------------- |
| `nft.updated`   | Público   | `{ price_eth, available_quantity, status, editions: [{ id, available }] }` |
| `order.updated` | Só o dono | `{ status, transaction?, rejection? }` e `user_id` no envelope             |

**Regras do cliente** (em `infrastructure/realtime`, sem conhecer features):

- **Duplicatas:** guardar os últimos `event_id` vistos (janela limitada) e descartar repetidos.
- **Eventos antigos:** só aplicar se `event.version > version_em_cache`. O estado nunca regride.
- **Pedido terminal:** `confirmed` e `rejected` não mudam mais.
- **Isolamento:** descartar `order.updated` cujo `user_id` não seja o da sessão atual.
- **Efeito no cache:** cada feature registra seu handler (`features/nft/realtime`,
  `features/orders/realtime`) e escreve no TanStack Query (`setQueryData`). O socket nunca atualiza
  componentes.
- **Carrinho e cotação:** ao chegar `nft.updated` de um NFT no carrinho, o cliente **invalida** o
  carrinho e a cotação e exibe um aviso acessível (`aria-live`). O total vem sempre da API.
- **Reconexão:** no segundo `connect`, invalidar as queries ativas (catálogo visível, detalhe,
  carrinho, cotação, pedido pendente) para reconciliar com o REST.

**Mocks:** `@mswjs/socket.io-binding` sobre a API de WebSocket do MSW. Limitações a documentar:
só funciona no navegador, exige `transports: ["websocket"]` (sem long polling) e o "servidor" vive
na mesma aba. Toda mudança passa pelo `mocks/db`, que **emite o evento e atualiza o REST juntos**.

Para os testes, um objeto `window.__mockControl` (apenas com mocks ativos) altera o `mocks/db`
(ex.: mudar o preço de um NFT) e o servidor Socket.IO emite o evento. A UI nunca é acionada
diretamente.

---

## 6. Cenários dos mocks

Mantemos os 13 ids já definidos em `src/mocks/scenarios/scenarioIds.ts` e **acrescentamos 4**:
`flaky`, `timeout`, `unauthorized` e `wallet-refused`. Seleção: `VITE_MOCK_SCENARIO` ou
`?scenario=<id>` (a URL tem prioridade). O reset restaura o banco para o estado conhecido.

| Cenário                 | Comportamento                                                                                      | Requisito do enunciado             |
| ----------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `default`               | Sucesso em tudo. Pedido pendente vira `confirmed` em 2 s                                           | Sucesso, pagamento confirmado      |
| `empty`                 | `GET /nfts` devolve zero itens                                                                     | Resultado vazio                    |
| `slow-network`          | Latência fixa de 2,5 s em todas as rotas                                                           | Lentidão, skeletons                |
| `out-of-order`          | Em `GET /nfts`, requisições ímpares atrasam 1,2 s e as pares 100 ms                                | Respostas fora de ordem            |
| `flaky`                 | Cada rota falha (rede) nas 2 primeiras chamadas e depois funciona                                  | Recuperação após nova tentativa    |
| `offline`               | Toda requisição falha como erro de rede                                                            | Falha de conexão                   |
| `server-error`          | Rotas de leitura e mutations respondem `503` (com `500` em `PUT /favorites`)                       | 4xx/5xx, rollback otimista         |
| `timeout`               | `GET /nfts` nunca responde dentro do limite de 10 s                                                | Timeout                            |
| `expired-session`       | O token expira após 15 s e a próxima chamada recebe `401 session_expired`                          | Sessão expirada                    |
| `unauthorized`          | Rotas privadas respondem `403 forbidden`                                                           | Acesso não autorizado              |
| `signup-conflict`       | Todo cadastro responde `409 email_taken`                                                           | Conflito de cadastro               |
| `invalid-coupon`        | Todo cupom responde `422 coupon_invalid`                                                           | Cupom inválido                     |
| `checkout-price-change` | Ao abrir o checkout, o preço de um item do carrinho muda e o evento `nft.updated` é emitido        | Preço alterado                     |
| `checkout-sold-out`     | A edição de um item esgota durante a compra                                                        | Edição esgotada                    |
| `order-timeout`         | `POST /orders` cria o pedido, mas a resposta demora mais que o timeout. O reenvio recupera o mesmo | Timeout após criação, idempotência |
| `payment-rejected`      | O pedido pendente vira `rejected` em 2 s (`payment_declined`)                                      | Pagamento recusado                 |
| `wallet-refused`        | `POST /wallets/:id/connect` responde `403 wallet_connection_refused`                               | Recusa de conexão                  |

Também há comportamento **guiado por dados**, que independe do cenário:

- Cupons: `LANCAMENTO10` (10% de desconto no subtotal, em aritmética de inteiros), `EXPIRADO`
  (`coupon_expired`) e `INVALIDO` (`coupon_invalid`). O padrão `Desconto do lançamento` do design
  vira o rótulo desse desconto.
- Cadastro com um e-mail ou usuário já existente nas fixtures responde `409`.
- Campos fora do formato (e-mail, endereço `0x`, senha curta) respondem `422` com `fieldErrors`.

---

## 7. Fixtures

### 7.1 Usuários (credenciais fictícias, definidas aqui)

| Usuário    | E-mail              | Senha        | Perfil                                                                                                           |
| ---------- | ------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Nova**   | `nova@kurio.test`   | `Kurio@2026` | Carteira principal `0xA91F…E82C` (MetaMask, Ethereum Mainnet) e secundária `nova.kurio.eth` (Polygon, "Reserva") |
| **Rafael** | `rafael@kurio.test` | `Kurio@2026` | Só carteira principal. Favoritos, carrinho e pedidos próprios, para testar o isolamento entre usuários           |

### 7.2 Catálogo

- **36 NFTs** (4 páginas de 9), com os 9 da seção 1.1 nas posições do design e os 27 restantes
  gerados de forma determinística.
- Cobrir os casos de teste: preços de `0.02` a `12.30`, os três redes, as categorias do filtro, pelo
  menos um `sold_out`, um com 1 unidade restante, um badge `limited` (o "NFT EM DESTAQUE") e vários
  `rare`.
- Emerald Ape #042 com as edições `1/1`, `1/10`, `1/50` e os demais atributos da seção 1.3.
- As imagens vêm dos assets do arquivo do Figma, baixados na etapa de implementação.

### 7.3 Redes e taxas

| Rede       | Taxa de rede              |
| ---------- | ------------------------- |
| `ethereum` | `0.016` (valor do design) |
| `polygon`  | `0.001` (definido aqui)   |
| `solana`   | `0.0005` (definido aqui)  |

### 7.4 Presets de estado

- `empty` (padrão): carrinhos vazios.
- `figma`: o carrinho da seção 1.4 (2x Emerald Ape, 6x Violet Nomad, 9x Ivory Baron), usado nas
  capturas de regressão visual para reproduzir o design.

---

## 8. Rotas do app (proposta)

| Rota                | Tela                  | Acesso                               |
| ------------------- | --------------------- | ------------------------------------ |
| `/`                 | Início (catálogo)     | Público. Busca/filtros/página na URL |
| `/nfts/$nftId`      | Detalhes do NFT       | Público                              |
| `/cart`             | Carrinho              | Público                              |
| `/checkout`         | Pagamento             | Privado                              |
| `/orders/$orderId`  | Confirmação do pedido | Privado                              |
| `/login`, `/signup` | Login e cadastro      | Público (com `redirect`)             |
| `/profile`          | Perfil                | Privado                              |
| `/profile/wallets`  | Carteiras             | Privado                              |

Rotas inexistentes têm tela própria. Itens fora do escopo (blog, atividade, ofertas, downloads,
suporte, redes sociais, "Ou continue com") **não fingem sucesso**: ficam desabilitados ou mostram
um aviso de "indisponível nesta demonstração".

---

## 9. Decisões em aberto

1. **Rótulos reais do filtro de Coleções** e o nome do 4º card (2.29 ETH): confirmar na captura de
   tela da Home.
2. **Overlay do pagamento:** o que ele mostra (conexão da carteira, revisão do pedido ou ambos).
3. **Campos obrigatórios do checkout:** manter todos os asteriscos do design ou tratar
   `Código de indicação` e `Nome ENS` como opcionais?
4. **Preço da edição:** o preço é do NFT (igual em todas as edições) ou cada edição tem o seu?
   Assumimos o primeiro.
5. **Nomes das rotas:** `/` e `/nfts/$nftId` ou algo ligado ao breadcrumb "Início / Mercado"?
6. **Ordenações adicionais** além de `Listados recentemente`, que o design não mostra.
