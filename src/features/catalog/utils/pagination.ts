export type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

export function getPageItems(page: number, totalPages: number, siblings = 1): PageItem[] {
  if (totalPages <= 0) return []

  const pageCount = Math.floor(totalPages)
  const total = siblings * 2 + 5
  if (pageCount <= total) return Array.from({ length: pageCount }, (_, index) => index + 1)

  const current = Math.min(Math.max(page, 1), pageCount)
  const left = Math.max(current - siblings, 2)
  const right = Math.min(current + siblings, pageCount - 1)
  const items: PageItem[] = [1]

  if (left > 2) items.push('ellipsis-start')
  for (let value = left; value <= right; value += 1) items.push(value)
  if (right < pageCount - 1) items.push('ellipsis-end')
  items.push(pageCount)

  return items
}
