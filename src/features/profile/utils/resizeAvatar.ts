export const AVATAR_SIZE = 256

/**
 * Reduz a imagem para um quadrado de 256 px (recorte central) antes do envio, o que mantém o
 * avatar leve no armazenamento do mock. Se o navegador não conseguir decodificar ou desenhar,
 * segue com o arquivo original: o servidor valida tipo e tamanho de qualquer forma.
 */
export async function resizeAvatar(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file

  try {
    const bitmap = await createImageBitmap(file)
    const side = Math.min(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE

    const context = canvas.getContext('2d')
    if (!context) return file

    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    )
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.85)
    })
    return blob ?? file
  } catch {
    return file
  }
}
