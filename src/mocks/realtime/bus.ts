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
