import type { ComponentProps } from 'react'

import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'

/**
 * No design o sufixo `.eth` vem num bloco à esquerda, com seta de seleção. Só existe um domínio,
 * então o seletor fica fixo; manter o elemento preserva o desenho sem prometer outras opções.
 */
export const EnsNameInput = ({ ...props }: ComponentProps<typeof Input>) => (
  <div className="grid grid-cols-[78px_minmax(0,1fr)] gap-2.5">
    <Select
      aria-label="Domínio ENS"
      defaultValue=".eth"
      disabled
      className="pr-8 pl-2.5 opacity-100"
    >
      <option value=".eth">.eth</option>
    </Select>
    <Input autoComplete="off" spellCheck={false} autoCapitalize="none" {...props} />
  </div>
)
