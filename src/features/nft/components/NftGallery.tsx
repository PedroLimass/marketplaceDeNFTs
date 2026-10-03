import { X, ZoomIn } from 'lucide-react'
import { useState } from 'react'
import { Dialog } from 'radix-ui'

import { cn } from '@/shared/lib/utils'

interface GalleryImage {
  url: string
  alt: string
}

interface NftGalleryProps {
  images: GalleryImage[]
  name: string
  /** `rail` é a coluna de miniaturas do desktop; `dots` são os indicadores do mobile. */
  navigation: 'rail' | 'dots'
  className?: string
}

function ZoomDialog({ image, name }: { image: GalleryImage; name: string }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`Ampliar imagem de ${name}`}
          className="absolute top-3 right-3 flex size-[30px] cursor-pointer items-center justify-center rounded-full bg-ink/70 text-foreground outline-none hover:bg-ink focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ZoomIn aria-hidden="true" className="size-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/80" />
        <Dialog.Content className="fixed inset-4 z-50 flex items-center justify-center outline-none md:inset-12">
          <Dialog.Title className="sr-only">{name}</Dialog.Title>
          <Dialog.Description className="sr-only">{image.alt}</Dialog.Description>
          <img
            src={image.url}
            alt={image.alt}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <Dialog.Close
            aria-label="Fechar imagem ampliada"
            className="absolute top-0 right-0 flex size-10 cursor-pointer items-center justify-center rounded-full bg-ink/80 text-foreground outline-none hover:bg-ink focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X aria-hidden="true" className="size-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function NftGallery({ images, name, navigation, className }: NftGalleryProps) {
  const [selected, setSelected] = useState(0)
  const current = images[selected] ?? images[0]
  if (!current) return null

  const main = (
    <div className="relative aspect-square w-full flex-1 overflow-hidden rounded-xl bg-surface-card p-3 md:rounded-lg md:p-5">
      <img
        src={current.url}
        alt={current.alt}
        width={1000}
        height={1000}
        fetchPriority="high"
        className="size-full rounded-[10px] object-cover md:rounded-[14px]"
      />
      <ZoomDialog image={current} name={name} />
    </div>
  )

  if (navigation === 'dots') {
    return (
      <div className={cn('flex flex-col items-center gap-4', className)}>
        {main}
        <div role="group" aria-label="Imagens do NFT" className="flex items-center">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              aria-label={`Ver imagem ${String(index + 1)} de ${String(images.length)}`}
              aria-current={index === selected}
              onClick={() => {
                setSelected(index)
              }}
              className="group flex size-6 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span
                className={cn(
                  'size-[7px] rounded-full transition-colors',
                  index === selected
                    ? 'bg-primary'
                    : 'bg-border-soft group-hover:bg-text-secondary',
                )}
              />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-start gap-4', className)}>
      <div
        role="group"
        aria-label="Imagens do NFT"
        className="flex w-20 shrink-0 flex-col gap-4 lg:w-[100px]"
      >
        {images.map((image, index) => (
          <button
            key={image.url}
            type="button"
            aria-label={`Ver imagem ${String(index + 1)} de ${String(images.length)}`}
            aria-current={index === selected}
            onClick={() => {
              setSelected(index)
            }}
            className={cn(
              'aspect-square cursor-pointer overflow-hidden rounded-lg border-2 bg-surface-card p-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-text-accent',
              index === selected ? 'border-primary' : 'border-transparent hover:border-border-soft',
            )}
          >
            <img
              src={image.url}
              alt=""
              width={100}
              height={100}
              loading="lazy"
              className="size-full rounded-md object-cover"
            />
          </button>
        ))}
      </div>
      {main}
    </div>
  )
}
