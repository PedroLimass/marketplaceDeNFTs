import { resetMockDb } from './db/mockDb'
import { updateNft } from './lib/nftMutations'
import { resolveOrder } from './lib/orders'
import {
  connectedClientCount,
  disconnectAllClients,
  replayLastEvent,
  sendStaleNftEvent,
} from './realtime/socketServer'
import { getScenarioId, setScenario, SCENARIO_STORAGE_KEY } from './scenarios/current'
import { mockScenarioIds, type MockScenarioId } from './scenarios/scenarioIds'

export interface MockControl {
  readonly scenarios: readonly MockScenarioId[]
  getScenario: () => MockScenarioId
  /** Troca o cenário e recarrega a página para começar do zero com ele. */
  setScenario: (id: MockScenarioId) => void
  /** Restaura o banco do mock ao estado inicial e recarrega a página. */
  reset: () => Promise<void>
  /**
   * Alterações no `mocks/db`, que atualizam o REST e emitem o evento Socket.IO juntos. A UI nunca
   * é acionada diretamente: ela só reage ao que chega pelo socket.
   */
  setNftPrice: (nftId: string, priceEth: string) => void
  setNftStock: (nftId: string, editionId: string, available: number) => void
  /** Conclui agora um pedido pendente, sem esperar o prazo do cenário. */
  resolveOrder: (orderId: string) => void
  /** Derruba as conexões Socket.IO; o cliente precisa reconectar e reconciliar sozinho. */
  disconnectSockets: () => void
  /** Reenvia o último evento com o mesmo `event_id` (deve ser descartado como repetido). */
  replayLastEvent: () => boolean
  /** Envia um `nft.updated` de versão antiga (deve ser ignorado). */
  sendStaleNftEvent: (nftId: string) => boolean
  connectedSockets: () => number
}

declare global {
  interface Window {
    __mockControl?: MockControl
  }
}

interface ControlDeps {
  storage: Pick<Storage, 'setItem' | 'removeItem'>
  reload: () => void
}

export function createMockControl({ storage, reload }: ControlDeps): MockControl {
  return {
    scenarios: mockScenarioIds,
    getScenario: getScenarioId,
    setScenario(id) {
      setScenario(id)
      storage.setItem(SCENARIO_STORAGE_KEY, id)
      reload()
    },
    async reset() {
      await resetMockDb()
      reload()
    },
    setNftPrice(nftId, priceEth) {
      updateNft(nftId, (nft) => {
        nft.previousPriceEth = nft.priceEth
        nft.priceEth = priceEth
      })
    },
    setNftStock(nftId, editionId, available) {
      updateNft(nftId, (nft) => {
        const edition = nft.editions.find((candidate) => candidate.id === editionId)
        if (edition) edition.available = available
      })
    },
    resolveOrder,
    disconnectSockets: disconnectAllClients,
    replayLastEvent,
    sendStaleNftEvent,
    connectedSockets: connectedClientCount,
  }
}
