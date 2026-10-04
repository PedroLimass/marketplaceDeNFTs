import { useState, type ComponentProps } from 'react'

import eyeHideIcon from '@/shared/assets/icons/eye-hide.svg'
import { Input } from '@/shared/ui/input'

/** Campo de senha com botão de mostrar/ocultar. O rótulo e o erro ficam por conta de `Field`. */
export function PasswordInput(props: Omit<ComponentProps<typeof Input>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-12" />
      <button
        type="button"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        onClick={() => {
          setVisible((current) => !current)
        }}
        className="absolute top-1/2 right-4 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <img
          src={eyeHideIcon}
          alt=""
          className={visible ? 'opacity-40' : undefined}
          width={19}
          height={15}
        />
      </button>
    </div>
  )
}
