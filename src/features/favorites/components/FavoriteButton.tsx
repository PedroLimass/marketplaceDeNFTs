import { Heart } from 'lucide-react'

import { useLoginRedirect } from '@/features/auth/hooks/useLoginRedirect'
import { useSession } from '@/features/auth/hooks/useSession'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

import { useFavoriteIds, useToggleFavorite } from '../hooks/useFavorites'

interface FavoriteButtonProps {
  nftId: string
  nftName: string
  variant?: 'text' | 'icon'
  className?: string
}

export function FavoriteButton({
  nftId,
  nftName,
  variant = 'text',
  className,
}: FavoriteButtonProps) {
  const { data: session } = useSession()
  const { ids } = useFavoriteIds()
  const toggle = useToggleFavorite()
  const goToLogin = useLoginRedirect()

  const favorite = ids.includes(nftId)

  const handleClick = () => {
    if (!session) {
      goToLogin()
      return
    }
    toggle.mutate({ nftId, favorite: !favorite })
  }

  const heart = <Heart aria-hidden="true" className={cn('size-5', favorite && 'fill-current')} />

  if (variant === 'icon') {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-pressed={favorite}
        aria-label={favorite ? `Remover ${nftName} dos favoritos` : `Favoritar ${nftName}`}
        onClick={handleClick}
        className={cn('rounded-full', favorite && 'text-text-accent', className)}
      >
        {heart}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={favorite}
      onClick={handleClick}
      className={cn(
        'min-w-[130px] border-primary text-text-accent hover:text-text-accent',
        className,
      )}
    >
      {heart}
      {favorite ? 'Favoritado' : 'Favoritar'}
    </Button>
  )
}
