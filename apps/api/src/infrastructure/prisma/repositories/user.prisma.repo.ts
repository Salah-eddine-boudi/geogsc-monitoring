/**
 * @file user.prisma.repo.ts
 * @description Implémentation Prisma du IUserRepository.
 *
 * MODIFICATION :
 * ✅ update() ajouté
 * ✅ findAll() ajouté
 */

import { prisma }            from '../prisma.js'
import type { IUserRepository, UpdateUserData } from '../../../domain/repositories/user.repository.js'
import type { UserEntity }   from '../../../domain/entities/user.entity.js'

export class UserPrismaRepository implements IUserRepository {

  async findByEmail(email: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({ where: { email } }) as Promise<UserEntity | null>
  }

  async findById(id: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { brigade: { select: { id: true, nom: true } } }
    }) as Promise<UserEntity | null>
  }

  async findAll(): Promise<UserEntity[]> {
    return prisma.user.findMany({
      where:   { actif: true },
      include: { brigade: { select: { id: true, nom: true } } },
      orderBy: { nom: 'asc' },
    }) as Promise<UserEntity[]>
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity> {
    return prisma.user.update({
      where: { id },
      data,
    }) as Promise<UserEntity>
  }
}