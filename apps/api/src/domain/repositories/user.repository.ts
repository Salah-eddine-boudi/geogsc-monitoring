/**
 * @file user.repository.ts
 * @description Interface (contrat) du repository User.
 * Le use-case dépend de cette interface — jamais de Prisma directement.
 * Si on change de BDD → on change uniquement l'implémentation, pas le use-case.
 */

import type { UserEntity } from '../entities/user.entity'

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>
  findById(id: string): Promise<UserEntity | null>
}
