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

### Catálogo e cabeçalho

- **Estados não desenhados**: carregamento (skeletons), erro com "Tentar novamente", catálogo vazio
  e item esgotado ("ESGOTADO", imagem esmaecida).
- **Faixa de preço sem intervalo** (catálogo vazio ou todos com o mesmo preço): em vez do controle
  deslizante, aparece só o texto da faixa.
- **Selo "RARO"/"LIMITADO"** nos cards: aparece só no mobile, como no Figma.
- **Busca no desktop**: os frames lidos não mostram campo de busca no cabeçalho; foi adicionado um
  ícone que expande em campo, com Escape para fechar.
- **Ordenação no mobile** fica dentro da folha de filtros, e não ao lado das abas.
- **Cards ainda sem link** para o detalhe, favoritos (coração) e barra de abas inferior: dependem
  de telas que ainda não foram feitas.
