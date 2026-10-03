import { nftFixtures } from '../fixtures/nfts'
import { userFixtures } from '../fixtures/users'
import { deterministicSalt, hashPassword } from '../lib/password'
import { DB_SCHEMA_VERSION, type MockDbState, type UserRecord } from './types'

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

  return {
    schemaVersion: DB_SCHEMA_VERSION,
    users,
    sessions: [],
    nfts: structuredClone([...nftFixtures]),
  }
}
