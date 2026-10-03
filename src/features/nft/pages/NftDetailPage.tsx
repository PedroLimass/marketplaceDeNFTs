import { useEffect } from 'react'

import { useNftDetail } from '@/features/catalog/hooks/useCatalog'
import { isApiError } from '@/infrastructure/http/errors'

import { NftDetailSkeleton } from '../components/NftDetailSkeleton'
import { NftLoadError, NftNotFound } from '../components/NftDetailStates'
import { NftDetailView } from '../components/NftDetailView'

export function NftDetailPage({ nftId }: { nftId: string }) {
  const detail = useNftDetail(nftId)
  const name = detail.data?.name

  useEffect(() => {
    document.title = name ? `${name} · Kurio` : 'Kurio — Marketplace de NFTs'
    return () => {
      document.title = 'Kurio — Marketplace de NFTs'
    }
  }, [name])

  if (detail.isPending) return <NftDetailSkeleton />

  if (detail.isError) {
    return isApiError(detail.error) && detail.error.kind === 'not_found' ? (
      <NftNotFound />
    ) : (
      <NftLoadError
        error={detail.error}
        onRetry={() => {
          void detail.refetch()
        }}
      />
    )
  }

  return <NftDetailView nft={detail.data} />
}
