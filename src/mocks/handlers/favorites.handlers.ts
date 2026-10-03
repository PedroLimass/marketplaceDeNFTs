import { http, HttpResponse } from 'msw'

import { getDb, mutateDb } from '../db/mockDb'
import { apiPath } from '../lib/apiPath'
import { errorResponse } from '../lib/errors'
import { requireUser } from '../lib/session'

const nftNotFound = () => errorResponse(404, 'nft_not_found', 'Este NFT não foi encontrado.')

export const favoritesHandlers = [
  http.get(apiPath('/favorites'), ({ request }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    return HttpResponse.json({ nft_ids: getDb().favorites[auth.user.id] ?? [] })
  }),

  // PUT e DELETE são idempotentes: repetir a chamada termina no mesmo estado.
  http.put(apiPath('/favorites/:nftId'), ({ request, params }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    const nftId = String(params.nftId)
    if (!getDb().nfts.some((nft) => nft.id === nftId)) return nftNotFound()

    mutateDb((db) => {
      const current = db.favorites[auth.user.id] ?? []
      if (!current.includes(nftId)) db.favorites[auth.user.id] = [...current, nftId]
    })

    return new HttpResponse(null, { status: 204 })
  }),

  http.delete(apiPath('/favorites/:nftId'), ({ request, params }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    const nftId = String(params.nftId)
    mutateDb((db) => {
      db.favorites[auth.user.id] = (db.favorites[auth.user.id] ?? []).filter((id) => id !== nftId)
    })

    return new HttpResponse(null, { status: 204 })
  }),
]
