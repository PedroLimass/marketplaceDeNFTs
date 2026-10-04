# Arquitetura do Kurio

> Este documento será completado ao longo da entrega (contratos REST e eventos, sessão, carrinho,
> cache, reconciliação REST × Socket.IO, limitações). Por enquanto registra o que o desafio pede
> desde já: **os desvios em relação ao Figma**, com o motivo de cada um.

## Desvios do Figma

Regra adotada: o Figma manda na composição, tipografia, cores e proporções. Só há desvio quando
(a) o Figma não desenha o estado ou o tamanho de tela, (b) o desenho não funciona de verdade no
navegador ou (c) há ganho claro de usabilidade ou acessibilidade. Cada desvio fica listado aqui.

### Hero (banner principal)

- **Largura intermediária**: o Figma fixa 600 px de texto e 450 px de imagem. Entre 768 e 1279 px a
  altura do banner e o tamanho do título passam a ser fluidos (`clamp`), e a imagem continua
  quadrada ocupando a altura toda. Em 1280 px ou mais as medidas são as do Figma (450 px de altura,
  título de 43 px).
- **Celulares estreitos (320–414 px)**: título e imagem também são fluidos; abaixo de 414 px o
  banner fica um pouco mais alto que no Figma, porque a descrição quebra em mais linhas.

### Autenticação (modal)

- **Telas baixas**: o Figma posiciona o modal a 160 px do topo. Quando a altura da janela não
  comporta isso, a margem diminui até 16 px e o conteúdo rola dentro do modal, para o botão de
  enviar nunca ficar fora da tela.

### Banners de destaque (abaixo do catálogo)

Frame de referência: `Desktop / Início` › `Promos` (`70353:241`).

| O que mudou              | Figma                                                   | Implementado                                                                                                                                                                                    | Motivo                                                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout interno           | Imagem à esquerda e texto à direita, em cards de 586 px | Os dois cards ficam lado a lado a partir de 1024 px. Com o card em 576 px ou mais (consulta de contêiner), vale o layout do Figma; mais estreito, a imagem vai para cima e o texto fica embaixo | Em cards de 470–510 px (telas de 1024–1279 px) o texto ficava com ~220 px e o título quebrava em três linhas. A decisão depende da largura do card, não da tela, e o Figma é reproduzido exatamente a partir de 1280 px |
| Área de clique           | Só o botão "Explorar"                                   | O card inteiro é clicável (o link se estende pelo card)                                                                                                                                         | Alvo maior e mais previsível; o texto do link continua sendo "Explorar"                                                                                                                                                 |
| Nome acessível do link   | "Explorar" nos dois banners                             | "Explorar: " + título do banner                                                                                                                                                                 | Dois links com o mesmo nome não se distinguem para leitores de tela                                                                                                                                                     |
| Interação                | Estática                                                | Ao passar o mouse: realce do contorno, imagem com leve zoom, botão mais claro e seta deslocada; com o foco do teclado aparece o anel de foco no card                                            | Retorno visual de que o banner é clicável. Os movimentos respeitam `prefers-reduced-motion`                                                                                                                             |
| Quebra de título e texto | Quebras fixas                                           | Título com `text-wrap: balance` e descrição com `pretty`                                                                                                                                        | Evita linhas órfãs em larguras intermediárias                                                                                                                                                                           |
| Mobile                   | Não desenhado                                           | Um banner por linha, com imagem em cima (160 px) e texto embaixo, alinhado à esquerda; sem os círculos decorativos                                                                              | O frame mobile do Figma termina na grade; o desafio pede que estados não desenhados sigam o mesmo padrão visual                                                                                                         |
| Destino do botão         | Não definido                                            | "Lançamentos gênesis…" abre o catálogo em "Novos lançamentos"; "Arte digital selecionada…" abre o catálogo completo                                                                             | Cada banner leva a uma listagem que existe de verdade                                                                                                                                                                   |

As imagens dos banners reutilizam as quatro artes de NFT já presentes no projeto (WebP), que são
as mesmas usadas no Figma, em vez dos PNGs de ~2 MB do arquivo de design.

### Diário da Cunhagem

- Os quatro cards ficam **centralizados** na seção; no Figma estão alinhados à esquerda e sobram
  56 px à direita, enquanto o título é centralizado.
- Abaixo de 1024 px a grade passa para 2 colunas e, abaixo de 640 px, para 1. O Figma só desenha o
  desktop.
- "Ler mais" aparece desabilitado: ainda não existem páginas de artigo.

### Rodapé

- Entre 768 e 1279 px, as três vantagens ficam em uma linha e a newsletter vem embaixo; a linha
  única do Figma só cabe a partir de 1280 px. No mobile tudo empilha.
- Links de perfil e de ajuda, redes sociais e "Ler mais" aparecem desabilitados
  (`aria-disabled`, dica "Indisponível nesta demonstração"), o mesmo padrão do menu do cabeçalho.
  Os links de **Coleções** funcionam e filtram o catálogo.
- A newsletter valida o e-mail e confirma localmente, sem enviar nada.

### Botões

Todos os botões saem de `src/shared/ui/button.tsx` (`Button` e `buttonVariants`, este último para
`<Link>` com aparência de botão). Antes, cada tela repetia suas próprias classes, com alturas de
35, 40, 45 e 60 px e hover/foco diferentes.

- **Variantes**: `default` (laranja, hover mais claro), `outline`, `ghost` e `link`.
- **Tamanhos**: `sm` (36 px no desktop, 40 px no mobile), `default` (40 px), `lg` (48 px) e `icon`.
  No mobile nenhum botão tem alvo de toque abaixo de 40 px.
- **Estados iguais para todos**: foco visível com anel, `disabled` esmaecido com cursor
  "não permitido", e `loading` (desabilita, marca `aria-busy` e mostra um indicador).
- **Desvios do Figma**: botão de envio dos formulários de login e cadastro com 48 px (Figma: 60 px
  no mobile e 45 px no desktop); "Entrar"/"Sair" com 36 px (Figma: 35 px); botões do Figma com
  raios de 5, 6 e 10 px passam todos a 6 px. O link "EXPLORAR" do banner no mobile segue como link
  de texto, como no Figma, mas com área de toque ampliada.

### Catálogo e cabeçalho

- **Estados não desenhados**: carregamento (skeletons), erro com "Tentar novamente", catálogo vazio
  e item esgotado ("ESGOTADO", imagem esmaecida).
- **Faixa de preço sem intervalo** (catálogo vazio ou todos com o mesmo preço): em vez do controle
  deslizante, aparece só o texto da faixa.
- **Selo "RARO"/"LIMITADO"** nos cards: aparece só no mobile, como no Figma.
- **Grade sem escalonamento no mobile**: o Figma mobile desce a coluna da direita em 32 px; ficou
  torto em telas reais e a grade agora mantém todas as linhas alinhadas (2 colunas até 559 px,
  3 colunas depois).
- **Busca no desktop**: os frames lidos não mostram campo de busca no cabeçalho; foi adicionado um
  ícone que expande em campo, com Escape para fechar.
- **Abas de listagem**: no Figma mobile a última aba aparece cortada ("Em..."), ou seja, a faixa
  rola de lado. A rolagem foi mantida, sem a barra visível e com o texto em 13 px (Figma: 14 px)
  para as três abas caberem em telas a partir de 390 px. Em tablet e desktop a ordenação passa para
  a linha de baixo quando não há espaço, em vez de espremer as abas.
- **Ordenação no mobile** fica dentro da folha de filtros, e não ao lado das abas.
- **Cards** levam ao detalhe (o título é o link e cobre o card inteiro). Favoritos (coração) e a barra
  de abas inferior dependem de telas que ainda não foram feitas.

### Detalhes do NFT

- **Desktop e mobile são marcações separadas** (`useMediaQuery`), porque a hierarquia muda: galeria
  em trilho de miniaturas versus carrossel com pontos, e botão "Comprar" fixo na base no mobile.
- **Trilha de navegação** inclui o nome do NFT (`Início / Mercado / {nome}`); "Mercado" não existe
  nesta demonstração e aparece sem link.
- **Edição e quantidade**: a edição sugerida é a de maior disponibilidade, e a quantidade é limitada
  ao menor valor entre o estoque da edição e o máximo por pedido (10). O limite é explicado em texto
  (`role="status"`), não só pelo botão desabilitado.
- **Avaliações**: o Figma mostra só a média e a contagem; a aba "Avaliações" informa que os
  comentários individuais não estão disponíveis, em vez de inventar conteúdo.
- **Relacionados**: grade de até 5 NFTs da mesma coleção, sem os pontos de carrossel do Figma.
- **Compartilhar**: links reais (LinkedIn, e-mail, X). Os ícones de marca foram copiados do rodapé,
  pois o `lucide-react` v1 não tem ícones de marca.
- **Estados não desenhados**: carregamento (skeleton), NFT inexistente, erro com nova tentativa e
  edição esgotada.

### Carrinho

- **Dono do carrinho**: visitante (cabeçalho `X-Guest-Id`, gerado no navegador) ou usuário
  autenticado. No login o carrinho do visitante é mesclado ao da conta (`POST /cart/merge`, idempotente),
  e o aviso de ajustes aparece se algum item precisou mudar.
- **Tabela e cartões**: a coluna "Edições" do Figma virou "Quantidade" (o controle de quantidade
  ocupa o lugar); no mobile cada item é um cartão com imagem de 100 px. O contador do cabeçalho
  soma unidades, não linhas.
- **Cupom**: o código só é guardado (`sessionStorage`) depois de validado por uma cotação; erro de
  cupom aparece no próprio campo. Se o cupom deixar de valer depois, ele é removido com aviso.
- **Mudanças de preço e estoque** aparecem num aviso `role="status"` com ação por item (aceitar o
  novo preço, ajustar a quantidade, remover). Enquanto houver pendências, "Conectar e finalizar"
  fica desabilitado: não se segue para o pagamento com uma cotação defasada.
- **Taxa de rede** é uma estimativa por rede (a cotação usa Ethereum até a escolha no pagamento).

### Conta: perfil e carteiras

Rotas privadas (`/profile` e `/profile/wallets`, sob o mesmo layout). Visitante é levado ao login e
volta ao destino depois. Os frames do Figma são só desktop; a versão mobile segue o mesmo padrão.

- **Menu lateral**: no desktop (a partir de 1024 px) é a coluna de 310 px do Figma. Abaixo disso
  vira duas abas no topo ("Detalhes do perfil" e "Carteiras") mais "Sair", e a grade de dois campos
  passa a uma coluna. Os itens do Figma fora do escopo (Atividade, Lista de observação, Ofertas,
  Downloads, Suporte) aparecem desabilitados no desktop, com aviso, e ficam de fora no mobile.
  Os rótulos estão em português (o Figma os traz em inglês).
- **Perfil: campos obrigatórios do Figma**: "Nome ENS" e "Apelido da carteira" aparecem com `*` no
  desenho, mas são opcionais no contrato (o usuário pode não ter ENS), então perderam o asterisco.
- **ENS**: o bloco `.eth` com seta, à esquerda do campo, foi mantido como um seletor fixo e
  desabilitado, já que só existe esse domínio. O valor guardado não leva o sufixo.
- **Salvar**: um único botão salva os dados do perfil e, se algum campo de senha foi preenchido,
  troca a senha também (os três campos passam a ser obrigatórios). Se o perfil for salvo e a senha
  falhar, o formulário mostra os dados novos, o erro no campo da senha e uma mensagem explicando.
- **Avatar**: "Alterar" e "Remover" agem na hora, sem esperar o "Salvar". Formato (JPG/PNG/WebP) e
  tamanho (2 MB) são validados antes do envio. A imagem é recortada em quadrado de 256 px no
  navegador e enviada como `multipart/form-data`. No mock ela vira data URL no `localStorage`
  (limitação: um avatar grande pode estourar a cota do navegador, e nesse caso só vale em memória).
- **Carteiras: campos fora do contrato**: o Figma reaproveita um formulário de pagamento (Nome de
  exibição, Nome do perfil, Código de indicação, E-mail e "ENS ou carteira secundária"). Ficaram só
  os campos de uma carteira: Rede, Tipo de carteira, Endereço, Apelido e Nome ENS.
- **Principal e secundária**: cada uma tem seu formulário. "Igual à carteira principal" (círculo no
  Figma) é uma caixa de seleção que salva a secundária como espelho da principal: se a principal
  mudar depois, a secundária muda junto. Desmarcar abre o formulário com os dados da principal para
  editar. A secundária não aceita o mesmo endereço da principal.
- **Validação do endereço**: `0x` + 40 hexadecimais para todas as redes, como no contrato. Isso não
  vale para endereços reais da Solana, e é uma limitação assumida da demonstração.
- **Conexão com a carteira** (`/wallets/:id/connect` e `/disconnect`) já existe no mock, com o
  cenário `wallet-refused`, e será usada no pagamento.

### Pagamento e confirmação

O limite de chamadas do Figma acabou antes da leitura visual destes dois frames. As telas foram
construídas a partir da estrutura salva (textos, medidas e hierarquia do recibo) e do contrato
(`docs/CONTRATOS.md`, seção 1.5). Por isso o desenho abaixo é uma interpretação, não uma cópia, e
convém compará-la com o Figma quando houver acesso.

- **Formulário do Figma**: o frame reaproveita o formulário de perfil (Nome do perfil, Nome de
  usuário, Código de indicação, Nome ENS, "ENS ou carteira secundária"). Estes campos não entram
  no pedido, que só leva `collector { display_name, email }` e a observação, então ficaram só
  **Nome de exibição**, **E-mail** e **Observação do colecionador (opcional)**. Os dois primeiros
  vêm preenchidos com os dados da conta. O asterisco de "Código de indicação" e "Nome ENS" (decisão
  em aberto no contrato) perdeu o sentido ao tirar esses campos.
- **Carteira e rede**: "Rede", "Endereço da carteira", "Tipo de carteira" e "Usar outra carteira?"
  viraram uma lista de escolha entre as carteiras já cadastradas (principal e secundária). A rede da
  compra é a da carteira escolhida, e a taxa de rede acompanha. O texto "Quer usar outra carteira?"
  leva a `/profile/wallets`, onde o cadastro já existe, em vez de duplicar o formulário aqui.
- **Overlay "Page Content (behind overlay)"**: não foi possível ver o conteúdo do overlay. A
  conexão da carteira acontece ao confirmar a compra, em duas fases visíveis no botão
  ("Conectando a carteira…" e "Enviando pedido…"), sem um passo extra de revisão.
- **Resumo**: itens com `(x N)` e subtotal, cupom (o mesmo componente do carrinho), taxa, total e
  "Confirmar compra". Em telas estreitas o resumo vai para baixo do formulário.
- **Recibo** (`/orders/:id`): o desenho é um modal de 578 px sobre a página de pagamento. Aqui é
  uma página própria, que serve também para quem recarrega ou volta pelo histórico, e o "X" leva
  ao início. O ícone `thank-you` (80 px) é um ícone do `lucide-react` sobre um círculo, porque o
  arquivo não estava disponível. Os quatro dados da transação ficam em quatro colunas no desktop e
  em duas no celular, e os itens usam imagem de 48 px abaixo de 640 px (70 px no desenho).
  "Ver no Etherscan" muda com a rede (Polygonscan, Solscan) e abre em outra aba.
- **Pendente e recusado**: o contrato prevê os dois e o Figma não os mostra. Pendente é um cartão
  com aviso `role="status"`, que se atualiza sozinho. Recusado explica o motivo, avisa que o
  carrinho foi mantido e oferece "Tentar novamente" e "Voltar ao carrinho".

**Idempotência.** A tentativa de compra fica em `sessionStorage` (`checkout.attempt`), com a chave
(`crypto.randomUUID()`), o corpo enviado, o `order_id` quando já existe e uma "intenção" (carrinho,
carteira, cupom e dados). Mesma intenção reaproveita chave e corpo, mesmo que a cotação tenha sido
recalculada no meio; outra intenção gera chave nova, depois de conferir `GET /orders?status=pending`
para não duplicar um pedido cuja resposta se perdeu. Falha de comunicação (timeout, rede, 5xx)
também confere os pedidos pendentes antes de pedir ao usuário que tente de novo. Falhas definitivas
(validação, disponibilidade) encerram a tentativa. `quote_stale` só a encerra quando o usuário
confirma os novos valores. Ao voltar para `/checkout` com um pedido em andamento, o app leva direto
ao pedido, e a tentativa termina quando o pedido chega a `confirmed` ou `rejected`.

**Mock do servidor.** As cotações passam a ser guardadas no banco do mock, e `POST /orders` as
confere: cotação vencida, preço, versão ou quantidade diferentes viram `quote_stale` com a cotação
nova; falta de estoque vira `insufficient_availability`. O estoque é reservado na criação e devolvido
se o pedido for recusado; o carrinho só perde o que foi comprado quando o pedido é confirmado. Um
pedido pendente é resolvido pelo prazo do cenário (2 s) de duas formas: um temporizador, para o
evento chegar na hora, e uma resolução preguiçosa nas leituras, para o pedido não ficar preso
quando a aba foi recarregada. As mudanças passam por um barramento interno (`mocks/realtime/bus`),
no qual o Socket.IO se apoia.
