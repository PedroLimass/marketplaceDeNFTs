import { describe, expect, it } from 'vitest'

import { compareEth } from '@/shared/lib/money'

import { categoryFixtures, collectionFixtures, nftFixtures } from './nfts'

const available = (nft: (typeof nftFixtures)[number]) =>
  nft.editions.reduce((sum, edition) => sum + edition.available, 0)

describe('nftFixtures', () => {
  it('tem 36 NFTs com ids e tokens únicos', () => {
    expect(nftFixtures).toHaveLength(36)
    expect(new Set(nftFixtures.map((nft) => nft.id)).size).toBe(36)
    expect(new Set(nftFixtures.map((nft) => nft.tokenId)).size).toBe(36)
  })

  it('traz os 9 cards do design na ordem da grade', () => {
    const firstPage = nftFixtures.slice(0, 9).map((nft) => [nft.name, nft.priceEth])

    expect(firstPage).toEqual([
      ['Emerald Ape #042', '1.19'],
      ['Sage Nomad #009', '1.69'],
      ['Neon Vessel #552', '1.99'],
      ['Cosmic Bloom #118', '1.29'],
      ['Violet Nomad #314', '1.39'],
      ['Ivory Baron #088', '1.79'],
      ['Golden Beat #207', '0.99'],
      ['Golden Frequency #071', '0.59'],
      ['Golden Signal #160', '0.39'],
    ])
  })

  it('cobre os extremos de preço, as redes e todas as categorias', () => {
    const prices = nftFixtures.map((nft) => nft.priceEth)
    const sorted = [...prices].sort(compareEth)

    expect(sorted[0]).toBe('0.02')
    expect(sorted.at(-1)).toBe('12.30')
    expect(new Set(nftFixtures.map((nft) => nft.network))).toEqual(
      new Set(['ethereum', 'polygon', 'solana']),
    )
    expect(new Set(nftFixtures.map((nft) => nft.categoryId))).toEqual(
      new Set(categoryFixtures.map((category) => category.id)),
    )
  })

  it('cobre os casos de estoque e selos usados nos testes', () => {
    expect(nftFixtures.some((nft) => available(nft) === 0)).toBe(true)
    expect(nftFixtures.some((nft) => available(nft) === 1)).toBe(true)
    expect(nftFixtures.some((nft) => nft.badge === 'limited')).toBe(true)
    expect(nftFixtures.filter((nft) => nft.badge === 'rare').length).toBeGreaterThanOrEqual(5)
  })

  it('marca a oferta da Neon Vessel com o preço anterior do design', () => {
    const neon = nftFixtures.find((nft) => nft.id === 'neon-vessel-552')

    expect(neon).toMatchObject({ priceEth: '1.99', previousPriceEth: '2.29' })
    expect(nftFixtures.filter((nft) => nft.previousPriceEth !== null).length).toBeGreaterThan(1)
  })

  it('só referencia coleções existentes e tem abas Novos e Em alta preenchidas', () => {
    const collections = new Set(collectionFixtures.map((collection) => collection.id))

    expect(nftFixtures.every((nft) => collections.has(nft.collectionId))).toBe(true)
    expect(nftFixtures.filter((nft) => nft.isNew).length).toBeGreaterThan(9)
    expect(nftFixtures.filter((nft) => nft.trendingRank !== null).length).toBeGreaterThan(9)
  })

  it('descreve o Emerald Ape #042 com as edições e atributos do design', () => {
    const emerald = nftFixtures[0]

    expect(emerald?.editions.map((edition) => edition.id)).toEqual(['1/1', '1/10', '1/50'])
    expect(emerald?.attributes).toEqual(['Óculos', 'Esmeralda', 'Raro'])
    expect(emerald?.collectionId).toBe('kurio-apes')
    expect(emerald?.creator).toEqual({ name: 'Nova Sato', royaltyPercent: 5 })
    expect(emerald?.rating).toEqual({ average: 4.8, count: 19 })
  })

  it('mantém as edições coerentes (disponível nunca passa da oferta)', () => {
    for (const nft of nftFixtures) {
      for (const edition of nft.editions) {
        expect(edition.available).toBeLessThanOrEqual(edition.supply)
      }
    }
  })
})
