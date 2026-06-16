export interface IRefreshTokenRepository {
  create(userId: string, token: string, expiresAt: Date): Promise<void>
  findByToken(token: string): Promise<{ userId: string; revoked: boolean; expiresAt: Date } | null>
  revoke(token: string): Promise<void>
  revokeAllForUser(userId: string): Promise<void>
}
