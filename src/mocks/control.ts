import { resetMockDb } from './db/mockDb'
import { getScenarioId, setScenario, SCENARIO_STORAGE_KEY } from './scenarios/current'
import { mockScenarioIds, type MockScenarioId } from './scenarios/scenarioIds'

export interface MockControl {
  readonly scenarios: readonly MockScenarioId[]
  getScenario: () => MockScenarioId
  /** Troca o cenário e recarrega a página para começar do zero com ele. */
  setScenario: (id: MockScenarioId) => void
  /** Restaura o banco do mock ao estado inicial e recarrega a página. */
  reset: () => Promise<void>
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
  }
}
