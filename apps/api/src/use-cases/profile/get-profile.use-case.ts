/**
 * @file get-profile.use-case.ts
 * @description Use-case : récupérer le profil de l'utilisateur connecté.
 *
 * RÈGLE : un utilisateur ne peut voir que son propre profil.
 */

import type { IUserRepository } from '../../domain/repositories/user.repository.js'
import type { UserEntity }      from '../../domain/entities/user.entity.js'
import { NotFoundError }        from '../../domain/errors.js'

export type ProfileDTO = Omit<UserEntity, 'password'>

export async function getProfileUseCase(
  userId: string,
  userRepository: IUserRepository
): Promise<ProfileDTO> {
  const user = await userRepository.findById(userId)
  if (!user) throw new NotFoundError('Utilisateur')

  const { password, ...profile } = user
  return profile
}