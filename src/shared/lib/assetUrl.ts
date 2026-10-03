/** Resolve um arquivo de `public/` respeitando o `base` do Vite (deploy em subcaminho). */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}
