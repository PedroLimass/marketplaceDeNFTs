export class SeenWindow {
  private readonly ids = new Set<string>()

  private readonly limit: number

  constructor(limit: number) {
    this.limit = limit
  }

  markNew(id: string): boolean {
    if (this.ids.has(id)) return false

    this.ids.add(id)
    if (this.ids.size > this.limit) {
      const [oldest] = this.ids
      if (oldest !== undefined) this.ids.delete(oldest)
    }
    return true
  }

  clear(): void {
    this.ids.clear()
  }
}
