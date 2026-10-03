import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { NewsletterForm } from '@/features/newsletter/NewsletterForm'

import facebook from './assets/social-facebook.svg'
import instagram from './assets/social-instagram.svg'
import linkedin from './assets/social-linkedin.svg'
import twitter from './assets/social-twitter.svg'
import youtube from './assets/social-youtube.svg'

const benefits = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

const collections = [
  { id: 'arte-digital', name: 'Arte digital' },
  { id: 'fotografia', name: 'Fotografia' },
  { id: 'musica', name: 'Música' },
  { id: 'arte-3d', name: 'Arte 3D' },
  { id: 'utilidade', name: 'Utilidade' },
] as const

const profileLinks = [
  'Meu perfil',
  'Minha coleção',
  'Atividade',
  'Estúdio do criador',
  'Lista de interesse',
] as const

const helpLinks = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
] as const

const socials = [
  { name: 'Facebook', icon: facebook },
  { name: 'Instagram', icon: instagram },
  { name: 'Twitter', icon: twitter },
  { name: 'LinkedIn', icon: linkedin },
  { name: 'YouTube', icon: youtube },
] as const

const linkClass =
  'rounded-sm leading-[30px] outline-none focus-visible:ring-2 focus-visible:ring-primary'

function Unavailable({ children }: { children: ReactNode }) {
  return (
    <span
      aria-disabled="true"
      title="Indisponível nesta demonstração"
      className="cursor-not-allowed"
    >
      {children}
    </span>
  )
}

function LinkColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-2 text-foreground">
      <h2 className="text-lg leading-4 font-bold">{title}</h2>
      <ul className="text-sm">{children}</ul>
    </nav>
  )
}

function Benefit({ letter, title, text }: (typeof benefits)[number]) {
  return (
    <div className="flex flex-col gap-3 px-4">
      <div
        aria-hidden="true"
        className="flex size-[74px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-ink"
      >
        {letter}
      </div>
      <h2 className="text-[17px] leading-4 font-bold text-foreground">{title}</h2>
      <p className="text-sm leading-[22px] text-text-secondary xl:w-[204px]">{text}</p>
    </div>
  )
}

function Divider() {
  return <div aria-hidden="true" className="hidden w-px self-stretch bg-primary xl:block" />
}

export function AppFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-[1200px] flex-col px-6 md:px-8 xl:px-0">
      <section
        aria-label="Vantagens e newsletter"
        className="flex flex-col gap-8 bg-surface-card p-8 xl:h-[250px] xl:flex-row xl:items-end xl:justify-between"
      >
        <div className="grid gap-8 sm:grid-cols-3 xl:contents">
          {benefits.map((benefit, index) => (
            <div key={benefit.letter} className="contents">
              {index > 0 ? <Divider /> : null}
              <div className="xl:w-[264px] xl:first:flex-1">
                <Benefit {...benefit} />
              </div>
            </div>
          ))}
        </div>
        <Divider />
        <div className="flex flex-col gap-3 px-4 xl:w-[357px]">
          <h2 className="text-lg leading-4 font-bold text-foreground">
            Antecipe-se ao próximo lançamento
          </h2>
          <div className="mt-1">
            <NewsletterForm />
          </div>
          <p className="text-[13px] leading-[22px] text-text-secondary">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-3 bg-surface-dark p-8 text-sm leading-[22px] text-foreground md:flex-row md:items-center md:gap-8 md:py-0 lg:h-[88px] xl:gap-[92px]">
        <p className="py-2 font-bold tracking-[1.4px] md:flex-1">KURIO</p>
        <p className="md:flex-1">
          Feito para colecionadores,
          <br />
          criadores e cultura
        </p>
        <a
          href="mailto:contato@email.com"
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary md:flex-1"
        >
          contato@email.com
        </a>
        <a
          href="tel:+551140028922"
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary md:w-[228px]"
        >
          +55 11 4002 8922
        </a>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-2 gap-8 bg-surface-card p-8 md:grid-cols-4 lg:grid-cols-[1fr_1fr_1fr_228px] lg:gap-12 xl:gap-[124px] xl:py-8">
          <LinkColumn title="Meu perfil">
            {profileLinks.map((label) => (
              <li key={label} className="leading-[30px]">
                <Unavailable>{label}</Unavailable>
              </li>
            ))}
          </LinkColumn>
          <LinkColumn title="Central de ajuda">
            {helpLinks.map((label) => (
              <li key={label} className="leading-[30px]">
                <Unavailable>{label}</Unavailable>
              </li>
            ))}
          </LinkColumn>
          <LinkColumn title="Coleções">
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link
                  to="/"
                  search={{ category: [collection.id] }}
                  hash="catalogo"
                  className={linkClass}
                >
                  {collection.name}
                </Link>
              </li>
            ))}
          </LinkColumn>
          <div className="col-span-2 flex flex-col gap-8 md:col-span-1">
            <div className="flex flex-col gap-5">
              <h2 className="text-lg leading-4 font-bold text-foreground">Redes sociais</h2>
              <ul className="flex items-center gap-2.5">
                {socials.map((social) => (
                  <li key={social.name}>
                    <img
                      src={social.icon}
                      alt={social.name}
                      width={32}
                      height={32}
                      className="-m-px max-w-none"
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-lg leading-4 font-bold text-foreground">Carteiras compatíveis</h2>
              <p className="flex h-[26px] items-center justify-center rounded-[6px] border border-border-soft bg-surface-dark text-[9px] font-bold tracking-[0.1px] whitespace-pre text-text-accent">
                {'METAMASK  •  WALLETCONNECT  •  COINBASE'}
              </p>
            </div>
          </div>
        </div>
        <p className="py-0 text-center text-sm leading-[30px] text-foreground">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}
