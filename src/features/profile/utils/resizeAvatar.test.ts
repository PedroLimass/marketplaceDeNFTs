import { afterEach, describe, expect, it, vi } from 'vitest'

import { AVATAR_SIZE, resizeAvatar } from './resizeAvatar'

const file = new File(['pixels'], 'avatar.png', { type: 'image/png' })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('resizeAvatar', () => {
  it('devolve o arquivo original quando o navegador não decodifica bitmap', async () => {
    vi.stubGlobal('createImageBitmap', undefined)

    await expect(resizeAvatar(file)).resolves.toBe(file)
  })

  it('recorte central vira um WebP de 256 px', async () => {
    const close = vi.fn()
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 400, height: 200, close }),
    )
    const blob = new Blob(['webp'], { type: 'image/webp' })
    const drawImage = vi.fn()
    const toBlob = vi.fn((done: (value: Blob | null) => void) => {
      done(blob)
    })
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toBlob,
    } as unknown as HTMLCanvasElement)

    await expect(resizeAvatar(file)).resolves.toBe(blob)
    expect(drawImage).toHaveBeenCalledWith(
      expect.anything(),
      100,
      0,
      200,
      200,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    )
    expect(close).toHaveBeenCalled()
  })

  it('cai no original se o canvas não tiver contexto 2d', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 10, height: 10, close: vi.fn() }),
    )
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => null,
    } as unknown as HTMLCanvasElement)

    await expect(resizeAvatar(file)).resolves.toBe(file)
  })

  it('cai no original se toBlob não gerar arquivo', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 10, height: 10, close: vi.fn() }),
    )
    vi.spyOn(document, 'createElement').mockReturnValue({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: vi.fn() }),
      toBlob: (done: (value: Blob | null) => void) => {
        done(null)
      },
    } as unknown as HTMLCanvasElement)

    await expect(resizeAvatar(file)).resolves.toBe(file)
  })

  it('cai no original se a decodificação falhar', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('formato inválido')))

    await expect(resizeAvatar(file)).resolves.toBe(file)
  })
})
