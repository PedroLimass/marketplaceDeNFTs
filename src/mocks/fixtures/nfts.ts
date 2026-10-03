import type { NetworkId, NftBadge } from '@/features/catalog/schemas/catalog.schemas'

import type { NftRecord } from '../db/types'

export interface CatalogRef {
  id: string
  name: string
}

/** Itens do filtro "Coleções" do design (na ordem em que aparecem). */
export const categoryFixtures: readonly CatalogRef[] = [
  { id: 'arte-digital', name: 'Arte digital' },
  { id: 'fotografia', name: 'Fotografia' },
  { id: 'musica', name: 'Música' },
  { id: 'arte-3d', name: 'Arte 3D' },
  { id: 'colecionaveis', name: 'Colecionáveis' },
  { id: 'generativa', name: 'Generativa' },
  { id: 'jogos', name: 'Jogos' },
  { id: 'assinaturas', name: 'Assinaturas' },
  { id: 'utilidade', name: 'Utilidade' },
]

export const networkFixtures: readonly CatalogRef[] = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'solana', name: 'Solana' },
]

/** Séries de NFTs ("Coleção: Kurio Apes" no detalhe). */
export const collectionFixtures: readonly CatalogRef[] = [
  { id: 'kurio-apes', name: 'Kurio Apes' },
  { id: 'sage-society', name: 'Sage Society' },
  { id: 'neon-syndicate', name: 'Neon Syndicate' },
  { id: 'violet-circle', name: 'Violet Circle' },
  { id: 'ivory-house', name: 'Ivory House' },
  { id: 'golden-era', name: 'Golden Era' },
]

type ArtId = NftRecord['art']

interface Row {
  adjective: string
  noun: string
  number: number
  price: string
  network: NetworkId
  category: string
  badge: NftBadge | null
  supply: number
  available: number
}

const adjectiveInfo: Record<string, { pt: string; art: ArtId; collection: string }> = {
  Emerald: { pt: 'Esmeralda', art: 1, collection: 'kurio-apes' },
  Cosmic: { pt: 'Cósmico', art: 1, collection: 'kurio-apes' },
  Sage: { pt: 'Sálvia', art: 2, collection: 'sage-society' },
  Violet: { pt: 'Violeta', art: 2, collection: 'violet-circle' },
  Neon: { pt: 'Neon', art: 3, collection: 'neon-syndicate' },
  Ivory: { pt: 'Marfim', art: 3, collection: 'ivory-house' },
  Golden: { pt: 'Dourado', art: 4, collection: 'golden-era' },
}

const nounPt: Record<string, string> = {
  Ape: 'Macaco',
  Nomad: 'Nômade',
  Vessel: 'Vaso',
  Bloom: 'Flor',
  Baron: 'Barão',
  Beat: 'Batida',
  Signal: 'Sinal',
  Frequency: 'Frequência',
}

/**
 * Os 9 primeiros são os cards do design, na ordem da grade (linha a linha). O "Golden Frequency #071"
 * não tem texto no Figma (o card do meio da última linha) e foi inferido da tela de login, onde
 * aparece a 0.59 ETH.
 */
const rows: readonly Row[] = [
  row('Emerald', 'Ape', 42, '1.19', 'ethereum', 'arte-digital', 'rare', 50, 50),
  row('Sage', 'Nomad', 9, '1.69', 'polygon', 'fotografia', null, 25, 25),
  row('Neon', 'Vessel', 552, '1.99', 'solana', 'musica', null, 20, 14),
  row('Cosmic', 'Bloom', 118, '1.29', 'ethereum', 'arte-3d', 'rare', 30, 22),
  row('Violet', 'Nomad', 314, '1.39', 'ethereum', 'generativa', 'limited', 100, 37),
  row('Ivory', 'Baron', 88, '1.79', 'ethereum', 'colecionaveis', 'rare', 60, 41),
  row('Golden', 'Beat', 207, '0.99', 'polygon', 'musica', null, 80, 64),
  row('Golden', 'Frequency', 71, '0.59', 'polygon', 'jogos', null, 90, 72),
  row('Golden', 'Signal', 160, '0.39', 'solana', 'utilidade', null, 200, 188),

  row('Emerald', 'Nomad', 77, '2.45', 'ethereum', 'arte-digital', 'rare', 40, 12),
  row('Sage', 'Ape', 233, '0.85', 'polygon', 'fotografia', null, 60, 60),
  row('Neon', 'Bloom', 401, '3.20', 'solana', 'arte-3d', 'rare', 15, 9),
  row('Cosmic', 'Baron', 19, '12.30', 'ethereum', 'colecionaveis', 'limited', 5, 2),
  row('Violet', 'Vessel', 266, '0.45', 'polygon', 'generativa', null, 120, 97),
  row('Ivory', 'Signal', 350, '1.05', 'solana', 'musica', null, 75, 75),
  row('Golden', 'Ape', 2, '8.75', 'ethereum', 'arte-digital', 'rare', 10, 1),
  row('Emerald', 'Beat', 148, '0.30', 'polygon', 'musica', null, 90, 71),
  row('Sage', 'Vessel', 512, '2.10', 'ethereum', 'jogos', null, 35, 0),
  row('Neon', 'Nomad', 91, '4.60', 'solana', 'assinaturas', null, 50, 33),
  row('Cosmic', 'Beat', 305, '0.02', 'polygon', 'utilidade', null, 500, 432),
  row('Violet', 'Bloom', 187, '1.55', 'ethereum', 'arte-3d', 'rare', 25, 18),
  row('Ivory', 'Ape', 64, '5.40', 'ethereum', 'arte-digital', 'rare', 12, 7),
  row('Golden', 'Nomad', 421, '0.72', 'solana', 'jogos', null, 150, 120),
  row('Emerald', 'Signal', 276, '1.92', 'polygon', 'utilidade', null, 70, 55),
  row('Sage', 'Baron', 138, '2.75', 'ethereum', 'colecionaveis', null, 30, 21),
  row('Neon', 'Beat', 617, '0.18', 'solana', 'musica', null, 300, 250),
  row('Cosmic', 'Vessel', 229, '6.90', 'ethereum', 'generativa', 'limited', 8, 3),
  row('Violet', 'Baron', 3, '9.99', 'ethereum', 'colecionaveis', 'rare', 6, 4),
  row('Ivory', 'Bloom', 195, '0.66', 'polygon', 'fotografia', null, 100, 88),
  row('Golden', 'Vessel', 340, '3.85', 'solana', 'jogos', null, 40, 26),
  row('Emerald', 'Bloom', 470, '1.48', 'ethereum', 'arte-3d', null, 55, 40),
  row('Sage', 'Beat', 86, '0.27', 'polygon', 'musica', null, 200, 166),
  row('Neon', 'Signal', 284, '2.38', 'solana', 'utilidade', null, 45, 30),
  row('Cosmic', 'Nomad', 153, '1.12', 'ethereum', 'assinaturas', null, 80, 67),
  row('Ivory', 'Vessel', 371, '4.05', 'polygon', 'colecionaveis', 'rare', 20, 11),
  row('Violet', 'Signal', 409, '0.95', 'solana', 'generativa', null, 65, 52),
]

function row(
  adjective: string,
  noun: string,
  number: number,
  price: string,
  network: NetworkId,
  category: string,
  badge: NftBadge | null,
  supply: number,
  available: number,
): Row {
  return { adjective, noun, number, price, network, category, badge, supply, available }
}

const trendingOrder = [
  'violet-nomad-314',
  'emerald-ape-042',
  'neon-vessel-552',
  'golden-ape-002',
  'ivory-baron-088',
  'cosmic-bloom-118',
  'golden-signal-160',
  'neon-bloom-401',
  'cosmic-baron-019',
  'ivory-ape-064',
  'sage-nomad-009',
  'golden-beat-207',
]

/** Ofertas: o Figma mostra a Neon Vessel a 1.99 ETH com 2.29 ETH ao lado (preço anterior). */
const previousPrices: Record<string, string> = {
  'neon-vessel-552': '2.29',
  'violet-bloom-187': '1.85',
  'ivory-ape-064': '5.90',
}

const NEW_COUNT = 12
const LISTING_BASE = Date.parse('2026-06-30T12:00:00.000Z')
const HOUR = 3_600_000
const creators = ['Nova Sato', 'Iris Calder', 'Teo Marangoni', 'Lia Okafor'] as const

function slugify(adjective: string, noun: string, number: number): string {
  return `${adjective}-${noun}-${String(number).padStart(3, '0')}`.toLowerCase()
}

function contractAddress(index: number): string {
  const body = (index * 7919 + 4242).toString(16).padStart(32, '0')
  return `0x7A42${body}19E8`
}

function buildEditions(source: Row, index: number): NftRecord['editions'] {
  if (index === 0) {
    return [
      { id: '1/1', label: '1/1', supply: 1, available: 1 },
      { id: '1/10', label: '1/10', supply: 10, available: 8 },
      { id: '1/50', label: '1/50', supply: 50, available: 50 },
    ]
  }

  const id = `1/${String(source.supply)}`
  return [{ id, label: id, supply: source.supply, available: source.available }]
}

function buildAttributes(source: Row, index: number): string[] {
  if (index === 0) return ['Óculos', 'Esmeralda', 'Raro']

  const info = adjectiveInfo[source.adjective]
  const attributes = [info?.pt ?? source.adjective, nounPt[source.noun] ?? source.noun]
  if (source.badge === 'rare') attributes.push('Raro')
  if (source.badge === 'limited') attributes.push('Edição limitada')
  return attributes
}

function build(source: Row, index: number): NftRecord {
  const info = adjectiveInfo[source.adjective]
  if (!info) throw new Error(`Adjetivo desconhecido nas fixtures: ${source.adjective}`)

  const collection = collectionFixtures.find((candidate) => candidate.id === info.collection)
  const id = slugify(source.adjective, source.noun, source.number)
  const name = `${source.adjective} ${source.noun} #${String(source.number).padStart(3, '0')}`
  const trendingIndex = trendingOrder.indexOf(id)
  const creator = creators[index % creators.length] ?? 'Nova Sato'

  return {
    id,
    tokenId: String(source.number).padStart(4, '0'),
    name,
    priceEth: source.price,
    previousPriceEth: previousPrices[id] ?? null,
    art: info.art,
    collectionId: info.collection,
    categoryId: source.category,
    network: source.network,
    badge: source.badge,
    version: 1,
    listedAt: new Date(LISTING_BASE - index * 36 * HOUR).toISOString(),
    isNew: index < NEW_COUNT,
    trendingRank: trendingIndex === -1 ? null : trendingIndex + 1,
    description: `${name} é uma obra digital da coleção ${collection?.name ?? 'Kurio'}, criada para colecionadores que valorizam acabamento artesanal e raridade verificável na blockchain.`,
    attributes: buildAttributes(source, index),
    editions: buildEditions(source, index),
    creator: { name: creator, royaltyPercent: index % 3 === 0 ? 5 : 10 },
    contractAddress: contractAddress(index),
    rating:
      index === 0
        ? { average: 4.8, count: 19 }
        : { average: 4.2 + (index % 7) / 10, count: 3 + ((index * 5) % 38) },
  }
}

export const nftFixtures: readonly NftRecord[] = rows.map(build)
