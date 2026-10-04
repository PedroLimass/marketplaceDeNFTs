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
  setScenario: (id: MockScenarioId) => void
  applyScenario: (id: MockScenarioId) => void
  reset: () => Promise<void>
  setNftPrice: (nftId: string, priceEth: string) => void
  setNftStock: (nftId: string, editionId: string, available: number) => void
  resolveOrder: (orderId: string) => void
  disconnectSockets: () => void
  replayLastEvent: () => boolean
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
    applyScenario(id) {
      setScenario(id)
      storage.setItem(SCENARIO_STORAGE_KEY, id)
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
