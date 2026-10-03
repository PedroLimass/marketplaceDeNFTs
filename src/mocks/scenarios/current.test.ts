import { beforeEach, describe, expect, it } from 'vitest'

import {
  getScenario,
  getScenarioId,
  nextRequestCount,
  resolveInitialScenario,
  SCENARIO_STORAGE_KEY,
  setScenario,
} from './current'

function storageWith(value: string | null): Pick<Storage, 'getItem'> {
  return { getItem: (key) => (key === SCENARIO_STORAGE_KEY ? value : null) }
}

describe('resolveInitialScenario', () => {
  it('prioriza a URL sobre a sessão e o ambiente', () => {
    expect(
      resolveInitialScenario({
        search: '?scenario=offline',
        storage: storageWith('empty'),
        fallback: 'default',
      }),
    ).toBe('offline')
  })

  it('usa o valor da sessão quando a URL não informa cenário', () => {
    expect(
      resolveInitialScenario({ search: '', storage: storageWith('empty'), fallback: 'default' }),
    ).toBe('empty')
  })

  it('cai para o ambiente quando não há nada válido', () => {
    expect(
      resolveInitialScenario({
        search: '?scenario=inexistente',
        storage: storageWith('tambem-invalido'),
        fallback: 'payment-rejected',
      }),
    ).toBe('payment-rejected')
    expect(resolveInitialScenario({ search: '', storage: undefined, fallback: 'default' })).toBe(
      'default',
    )
  })
})

describe('cenário atual', () => {
  beforeEach(() => {
    setScenario('default')
  })

  it('troca o cenário e reinicia os contadores', () => {
    expect(nextRequestCount('GET', '/nfts')).toBe(1)
    expect(nextRequestCount('GET', '/nfts')).toBe(2)

    setScenario('flaky')

    expect(getScenarioId()).toBe('flaky')
    expect(getScenario().id).toBe('flaky')
    expect(nextRequestCount('GET', '/nfts')).toBe(1)
  })

  it('conta separadamente cada par método + rota', () => {
    expect(nextRequestCount('GET', '/nfts')).toBe(1)
    expect(nextRequestCount('POST', '/nfts')).toBe(1)
    expect(nextRequestCount('GET', '/cart')).toBe(1)
  })
})
