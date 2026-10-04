import { http, HttpResponse } from 'msw'

import {
  walletRequestSchema,
  walletRoleSchema,
  type WalletsResponse,
} from '@/features/wallets/schemas/wallet.schemas'

import { mutateDb } from '../db/mockDb'
import type { WalletRecord } from '../db/types'
import { apiPath } from '../lib/apiPath'
import { errorResponse, readJson, validationErrorResponse } from '../lib/errors'
import { requireUser } from '../lib/session'
import { findWallet, toWalletDto, walletsOf } from '../lib/wallets'
import { getScenario } from '../scenarios/current'

const walletNotFound = () => errorResponse(404, 'wallet_not_found', 'Carteira não encontrada.')

export const walletsHandlers = [
  http.get(apiPath('/wallets'), ({ request }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    const body: WalletsResponse = {
      items: walletsOf(auth.user.id)
        .toSorted((a, b) => (a.role === b.role ? 0 : a.role === 'primary' ? -1 : 1))
        .map((wallet) => toWalletDto(wallet, auth.user.id)),
    }
    return HttpResponse.json(body)
  }),

  http.put(apiPath('/wallets/:role'), async ({ request, params }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    const role = walletRoleSchema.safeParse(params.role)
    if (!role.success) return walletNotFound()

    const parsed = walletRequestSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationErrorResponse(parsed.error)

    const userId = auth.user.id
    const primary = findWallet(userId, 'primary')
    const existing = findWallet(userId, role.data)

    if ('same_as_primary' in parsed.data) {
      if (role.data !== 'secondary') {
        return errorResponse(
          422,
          'validation_failed',
          'Somente a carteira secundária pode repetir a principal.',
          {
            same_as_primary: ['Somente a carteira secundária pode ser igual à principal.'],
          },
        )
      }
      if (!primary) {
        return errorResponse(
          422,
          'primary_wallet_required',
          'Cadastre a carteira principal antes.',
          {
            same_as_primary: ['Cadastre a carteira principal primeiro.'],
          },
        )
      }
    } else if (
      role.data === 'secondary' &&
      primary?.address.toLowerCase() === parsed.data.address.toLowerCase()
    ) {
      return errorResponse(
        422,
        'validation_failed',
        'Este endereço já é o da carteira principal.',
        {
          address: [
            'Este endereço já é o da carteira principal. Use "Igual à carteira principal".',
          ],
        },
      )
    }

    const record = mutateDb((db): WalletRecord => {
      const next: WalletRecord =
        'same_as_primary' in parsed.data
          ? {
              id: existing?.id ?? `wlt_${crypto.randomUUID()}`,
              role: role.data,
              type: 'metamask',
              network: 'ethereum',
              address: '',
              nickname: '',
              ensName: null,
              sameAsPrimary: true,
            }
          : {
              id: existing?.id ?? `wlt_${crypto.randomUUID()}`,
              role: role.data,
              type: parsed.data.type,
              network: parsed.data.network,
              address: parsed.data.address,
              nickname: parsed.data.nickname,
              ensName: parsed.data.ens_name ?? null,
              sameAsPrimary: false,
            }

      const others = (db.wallets[userId] ?? []).filter((wallet) => wallet.role !== role.data)
      db.wallets[userId] = [...others, next]
      return next
    })

    return HttpResponse.json(toWalletDto(record, userId), { status: existing ? 200 : 201 })
  }),

  http.post(apiPath('/wallets/:id/connect'), ({ request, params }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    if (!walletsOf(auth.user.id).some((wallet) => wallet.id === params.id)) return walletNotFound()

    if (getScenario().wallet.connection === 'refused') {
      return errorResponse(
        403,
        'wallet_connection_refused',
        'A conexão com a carteira foi recusada.',
      )
    }

    return HttpResponse.json({ status: 'connected' })
  }),

  http.post(apiPath('/wallets/:id/disconnect'), ({ request, params }) => {
    const auth = requireUser(request)
    if ('response' in auth) return auth.response

    if (!walletsOf(auth.user.id).some((wallet) => wallet.id === params.id)) return walletNotFound()

    return new HttpResponse(null, { status: 204 })
  }),
]
