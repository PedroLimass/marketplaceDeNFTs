import { Tabs } from 'radix-ui'

import { networkLabels } from '@/features/catalog/constants'
import type { NftDetail } from '@/features/catalog/types/catalog'
import { shortenAddress } from '@/shared/lib/address'

const tabClass =
  'relative cursor-pointer pb-[7px] text-[15px] leading-4 text-foreground outline-none after:absolute after:inset-x-0 after:-bottom-px after:hidden after:h-0.5 after:bg-primary after:content-[""] focus-visible:ring-2 focus-visible:ring-primary data-[state=active]:text-text-accent data-[state=active]:after:block'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-sm leading-6 text-text-secondary">
      <strong className="font-bold text-text-primary">{label}</strong> {children}
    </p>
  )
}

export function NftInfoTabs({ nft }: { nft: NftDetail }) {
  const network = networkLabels[nft.contract.network]

  return (
    <Tabs.Root defaultValue="details" className="flex flex-col gap-6">
      <Tabs.List
        aria-label="Informações do NFT"
        className="-mx-1 flex max-w-full gap-8 overflow-x-auto border-b border-border-soft px-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Tabs.Trigger value="details" className={`${tabClass} shrink-0 whitespace-nowrap`}>
          Detalhes do NFT
        </Tabs.Trigger>
        <Tabs.Trigger value="reviews" className={`${tabClass} shrink-0 whitespace-nowrap`}>
          Avaliações de colecionadores ({nft.rating.count})
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="details" className="flex flex-col gap-3 outline-none">
        <p className="text-sm leading-6 text-text-secondary">{nft.description}</p>
        <Row label="Rede:">
          Cunhado na {network} com procedência imutável e metadados armazenados no IPFS (
          <span className="break-all">{nft.contract.metadataUri}</span>).
        </Row>
        <Row label="Contrato:">
          {shortenAddress(nft.contract.address)} • Contrato inteligente {nft.contract.standard}{' '}
          verificado.
        </Row>
        <Row label="Direitos autorais:">
          {nft.creator.name} recebe {nft.creator.royaltyPercent}% de royalties nas vendas
          secundárias, pagos automaticamente pelos marketplaces compatíveis.
        </Row>
      </Tabs.Content>

      <Tabs.Content value="reviews" className="flex flex-col gap-2 outline-none">
        <p className="text-sm leading-6 text-text-primary">
          Nota média {nft.rating.average.toFixed(1)} de 5, com {nft.rating.count} avaliações de
          colecionadores.
        </p>
        <p className="text-sm leading-6 text-text-secondary">
          Os comentários individuais não estão disponíveis nesta demonstração.
        </p>
      </Tabs.Content>
    </Tabs.Root>
  )
}
