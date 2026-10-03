import facebookIcon from '@/shared/assets/icons/facebook.svg'
import google1 from '@/shared/assets/icons/google-1.svg'
import google2 from '@/shared/assets/icons/google-2.svg'
import google3 from '@/shared/assets/icons/google-3.svg'
import google4 from '@/shared/assets/icons/google-4.svg'
import google5 from '@/shared/assets/icons/google-5.svg'
import google6 from '@/shared/assets/icons/google-6.svg'
import google7 from '@/shared/assets/icons/google-7.svg'

export type SocialProvider = 'Google' | 'Facebook'

const googlePieces: readonly { src: string; className: string }[] = [
  { src: google1, className: 'inset-[57.68%_17.83%_0_7.11%]' },
  { src: google2, className: 'bottom-0 left-1/2 right-[17.83%] top-[71.33%]' },
  { src: google3, className: 'inset-[24.69%_75.25%_24.69%_0]' },
  { src: google4, className: 'inset-[38.28%_0_11.97%_47.07%]' },
  { src: google5, className: 'bottom-[11.97%] left-1/2 right-0 top-[38.28%]' },
  { src: google6, className: 'inset-[0_17.01%_57.68%_7.11%]' },
  { src: google7, className: 'bottom-[70.51%] left-1/2 right-[17.01%] top-0' },
]

function GoogleMark() {
  return (
    <span className="relative size-5 shrink-0 overflow-clip" aria-hidden="true">
      {googlePieces.map((piece) => (
        <span key={piece.src} className={`absolute ${piece.className}`}>
          <img src={piece.src} alt="" className="absolute block inset-0 size-full max-w-none" />
        </span>
      ))}
    </span>
  )
}

interface SocialSignInProps {
  onSelect: (provider: SocialProvider) => void
}

/**
 * Login social não existe neste produto de demonstração. Os botões seguem o design,
 * mas se declaram indisponíveis (aria-disabled) e avisam ao serem acionados,
 * em vez de fingir uma autenticação.
 */
export function SocialSignIn({ onSelect }: SocialSignInProps) {
  const buttonClass =
    'flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-border text-[13px] leading-4 font-medium text-text-secondary outline-none focus-visible:border-primary'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 md:gap-3">
        <span className="h-px flex-1 bg-border-soft" aria-hidden="true" />
        <p className="text-[13px] leading-4 text-foreground">Ou continue com</p>
        <span className="h-px flex-1 bg-border-soft" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-4 md:px-20">
        <button
          type="button"
          aria-disabled="true"
          className={buttonClass}
          onClick={() => {
            onSelect('Google')
          }}
        >
          <GoogleMark />
          Continuar com Google
        </button>
        <button
          type="button"
          aria-disabled="true"
          className={buttonClass}
          onClick={() => {
            onSelect('Facebook')
          }}
        >
          <img src={facebookIcon} alt="" width={20} height={20} className="size-5" />
          Continuar com Facebook
        </button>
      </div>
    </div>
  )
}
