import { X } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { dismissToast, useToasts, type ToastKind } from '@/shared/lib/toast'

const kindClass: Record<ToastKind, string> = {
  success: 'border-success',
  error: 'border-text-coral',
  info: 'border-border-soft',
}

/**
 * Região de avisos. Erros usam `role="alert"` (anunciado na hora); os demais, `status`
 * (anunciado quando o leitor de tela estiver livre).
 */
export function Toaster() {
  const toasts = useToasts()

  return (
    <div
      aria-label="Notificações"
      role="region"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 md:items-end md:justify-end md:px-4"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role={item.kind === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-surface-raised px-4 py-3 text-sm text-foreground shadow-lg',
            kindClass[item.kind],
          )}
        >
          <p className="flex-1 leading-5">{item.text}</p>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={() => {
              dismissToast(item.id)
            }}
            className="-m-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-text-secondary outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
