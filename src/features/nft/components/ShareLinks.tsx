import { Mail } from 'lucide-react'

import linkedinIcon from '../assets/share-linkedin.svg'
import twitterIcon from '../assets/share-twitter.svg'

const linkClass =
  'flex size-8 items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary'

/** Links de compartilhamento reais, abertos em outra aba. */
export function ShareLinks({ title, url }: { title: string; url: string }) {
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(`Veja ${title} na Kurio`)

  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      <p id="compartilhar-rotulo" className="mr-2">
        Compartilhar este NFT:
      </p>
      <ul aria-labelledby="compartilhar-rotulo" className="flex items-center gap-1">
        <li>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no LinkedIn (abre em nova aba)"
            className={linkClass}
          >
            <img src={linkedinIcon} alt="" width={32} height={32} />
          </a>
        </li>
        <li>
          <a
            href={`mailto:?subject=${encodedText}&body=${encodedUrl}`}
            aria-label="Compartilhar por e-mail"
            className={`${linkClass} border border-primary text-primary`}
          >
            <Mail aria-hidden="true" className="size-4" />
          </a>
        </li>
        <li>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartilhar no X (abre em nova aba)"
            className={linkClass}
          >
            <img src={twitterIcon} alt="" width={32} height={32} />
          </a>
        </li>
      </ul>
    </div>
  )
}
