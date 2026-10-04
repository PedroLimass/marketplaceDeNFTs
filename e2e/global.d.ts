interface E2eMockControl {
  applyScenario: (id: string) => void
  setNftPrice: (nftId: string, priceEth: string) => void
  setNftStock: (nftId: string, editionId: string, available: number) => void
  resolveOrder: (orderId: string) => void
  disconnectSockets: () => void
  replayLastEvent: () => boolean
  sendStaleNftEvent: (nftId: string) => boolean
  connectedSockets: () => number
}

interface Window {
  __mockControl?: E2eMockControl
}
