import { nftFixtures } from '../fixtures/nfts'
import { userFixtures } from '../fixtures/users'
import { walletFixtures } from '../fixtures/wallets'
import { deterministicSalt, hashPassword } from '../lib/password'
import { DB_SCHEMA_VERSION, type MockDbState, type UserRecord, type WalletRecord } from './types'

export const SEED_CREATED_AT = '2026-07-01T12:00:00.000Z'

/** Estado conhecido e reproduzível: o reset sempre volta exatamente para ele. */
export async function createSeedState(): Promise<MockDbState> {
  const users: UserRecord[] = await Promise.all(
    userFixtures.map(async (fixture) => {
      const passwordSalt = deterministicSalt(fixture.id)

      return {
        id: fixture.id,
        username: fixture.username,
        displayName: fixture.displayName,
        email: fixture.email,
        passwordSalt,
        passwordHash: await hashPassword(fixture.password, passwordSalt),
        ensName: fixture.ensName,
        walletNickname: fixture.walletNickname,
        avatarUrl: null,
        createdAt: SEED_CREATED_AT,
      }
    }),
  )

  const wallets: Record<string, WalletRecord[]> = {}
  for (const fixture of walletFixtures) {
    wallets[fixture.userId] = [
      ...(wallets[fixture.userId] ?? []),
      {
        id: `wlt_${fixture.userId}_${fixture.role}`,
        role: fixture.role,
        type: fixture.type,
        network: fixture.network,
        address: fixture.address,
        nickname: fixture.nickname,
        ensName: fixture.ensName,
        sameAsPrimary: false,
      },
    ]
  }

  return {
    schemaVersion: DB_SCHEMA_VERSION,
    users,
    sessions: [],
    nfts: structuredClone([...nftFixtures]),
    favorites: {},
    carts: {},
    wallets,
    quotes: {},
    orders: [],
    idempotency: {},
    scenarioEffects: {},
  }
}
