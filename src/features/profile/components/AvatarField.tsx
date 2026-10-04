import { ImageIcon } from 'lucide-react'
import { useId, useRef, useState, type ChangeEvent } from 'react'

import { applyApiMessage } from '@/shared/lib/forms/applyApiError'
import { toast } from '@/shared/lib/toast'
import { Button } from '@/shared/ui/button'

import { useRemoveAvatar, useUploadAvatar } from '../hooks/useProfile'
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from '../schemas/profile.schemas'

function validate(file: File): string | null {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
    return 'Use uma imagem JPG, PNG ou WebP.'
  }
  if (file.size > AVATAR_MAX_BYTES) return 'A imagem deve ter no máximo 2 MB.'
  return null
}

/** O avatar é salvo na hora, de forma independente do botão "Salvar" do formulário. */
export function AvatarField({ avatarUrl }: { avatarUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const labelId = useId()
  const errorId = useId()
  const [error, setError] = useState<string | null>(null)
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()
  const busy = upload.isPending || remove.isPending

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const problem = validate(file)
    if (problem) {
      setError(problem)
      return
    }

    setError(null)
    upload.mutate(file, {
      onSuccess: () => {
        toast.success('Avatar atualizado.')
      },
      onError: (failure) => {
        setError(applyApiMessage(failure))
      },
    })
  }

  return (
    <div className="flex flex-col gap-2.5" role="group" aria-labelledby={labelId}>
      <p id={labelId} className="text-[13px] leading-[15px] font-bold text-text-primary">
        Avatar
      </p>
      <div className="flex items-center gap-6">
        <div className="flex size-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-card">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Seu avatar" className="size-full object-cover" />
          ) : (
            <ImageIcon aria-hidden="true" className="size-6 text-text-secondary" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <input
            ref={inputRef}
            type="file"
            hidden
            accept={AVATAR_TYPES.join(',')}
            aria-label="Arquivo do avatar"
            onChange={handleChange}
          />
          <Button
            type="button"
            variant="outline"
            loading={upload.isPending}
            disabled={busy}
            aria-describedby={error ? errorId : undefined}
            onClick={() => inputRef.current?.click()}
          >
            Alterar
          </Button>
          {avatarUrl ? (
            <Button
              type="button"
              variant="link"
              className="text-sm"
              loading={remove.isPending}
              disabled={busy}
              onClick={() => {
                setError(null)
                remove.mutate(undefined, {
                  onSuccess: () => {
                    toast.info('Avatar removido.')
                  },
                  onError: (failure) => {
                    setError(applyApiMessage(failure))
                  },
                })
              }}
            >
              Remover
            </Button>
          ) : null}
        </div>
      </div>
      <p
        id={errorId}
        role={error ? 'alert' : undefined}
        className="min-h-4 text-xs leading-4 text-destructive"
      >
        {error}
      </p>
    </div>
  )
}
