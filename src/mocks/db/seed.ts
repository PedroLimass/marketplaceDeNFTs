import { nftFixtures } from '../fixtures/nfts'
import { userFixtures } from '../fixtures/users'
import { walletFixtures } from '../fixtures/wallets'
import { DB_SCHEMA_VERSION, type MockDbState, type UserRecord, type WalletRecord } from './types'

export const SEED_CREATED_AT = '2026-07-01T12:00:00.000Z'

export async function createSeedState(): Promise<MockDbState> {
  const users: UserRecord[] = userFixtures.map((fixture) => ({
    id: fixture.id,
    username: fixture.username,
    displayName: fixture.displayName,
    email: fixture.email,
    passwordSalt: fixture.passwordSalt,
    passwordHash: fixture.passwordHash,
    ensName: fixture.ensName,
    walletNickname: fixture.walletNickname,
    avatarUrl: null,
    createdAt: SEED_CREATED_AT,
  }))

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
        connected: true,
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
