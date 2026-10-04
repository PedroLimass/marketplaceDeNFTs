/**
 * Barramento interno do mock: o banco anuncia o que mudou e o servidor Socket.IO (ou qualquer
 * outro assinante) decide o que emitir. Assim o REST e o tempo real nunca divergem: os dois
 * leem o mesmo estado, e quem altera o estado só precisa chamar `publish`.
 */
export type DomainEvent =
  { kind: 'nft'; nftId: string } | { kind: 'order'; orderId: string; userId: string }

type Listener = (event: DomainEvent) => void

const listeners = new Set<Listener>()

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function publish(event: DomainEvent): void {
  for (const listener of [...listeners]) listener(event)
}
