import { assetUrl } from '@/shared/lib/assetUrl'

interface Article {
  id: string
  date: string
  dateLabel: string
  minutes: number
  title: string
  summary: string
  art: 'art-1' | 'art-2' | 'art-3' | 'art-4'
}

const articles: readonly Article[] = [
  {
    id: 'propriedade',
    date: '2026-09-12',
    dateLabel: '12 de setembro',
    minutes: 6,
    title: 'Como funciona a propriedade de NFTs',
    summary: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    art: 'art-3',
  },
  {
    id: 'artistas',
    date: '2026-09-13',
    dateLabel: '13 de setembro',
    minutes: 2,
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que moldam a cultura digital.',
    art: 'art-1',
  },
  {
    id: 'raridade',
    date: '2026-09-15',
    dateLabel: '15 de setembro',
    minutes: 3,
    title: 'Raridade, atributos e procedência',
    summary: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    art: 'art-2',
  },
  {
    id: 'carteira',
    date: '2026-09-15',
    dateLabel: '15 de setembro',
    minutes: 2,
    title: 'Como proteger sua carteira',
    summary: 'Proteja sua carteira, seus ativos e sua identidade.',
    art: 'art-4',
  },
]

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg bg-surface-card">
      <img
        src={assetUrl(`assets/nfts/${article.art}-500.webp`)}
        alt=""
        width={500}
        height={500}
        loading="lazy"
        decoding="async"
        className="h-[195px] w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
        <p className="text-xs leading-4 font-medium whitespace-pre-wrap text-text-secondary">
          <time dateTime={article.date}>{article.dateLabel}</time>
          {`  |  Leitura de ${String(article.minutes)} min`}
        </p>
        <h3 className="text-base leading-[normal] font-bold text-text-primary">{article.title}</h3>
        <p className="text-xs leading-4 font-medium text-text-secondary">{article.summary}</p>
        <span
          aria-disabled="true"
          title="Indisponível nesta demonstração"
          className="mt-auto flex cursor-not-allowed gap-1 text-xs text-text-accent"
        >
          <span className="leading-[14px] font-bold">Ler mais</span>
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </article>
  )
}

export function MintDiary() {
  return (
    <section
      aria-labelledby="diario-titulo"
      className="mx-auto mt-12 flex w-full max-w-[1200px] flex-col gap-10 px-6 md:mt-0 md:px-8 xl:px-0"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <h2
          id="diario-titulo"
          className="w-full text-[28px] leading-[normal] font-bold text-text-primary"
        >
          Diário da Cunhagem
        </h2>
        <p className="w-full text-sm leading-[normal] text-text-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>

      <div className="grid grid-cols-1 justify-center gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(4,268px)]">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  )
}
