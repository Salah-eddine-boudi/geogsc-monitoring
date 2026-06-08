/**
 * @file user.prisma.repo.ts
 * @description Implémentation concrète du IUserRepository avec Prisma.
 * C'est la SEULE couche qui connaît Prisma.
 */

import type { IUserRepository } from '../../../domain/repositories/user.repository.js'
import type { UserEntity } from '../../../domain/entities/user.entity'
import { prisma } from '../prisma.js'

export class UserPrismaRepository implements IUserRepository {

  async findByEmail(email: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  async findById(id: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { id } })
  }
}