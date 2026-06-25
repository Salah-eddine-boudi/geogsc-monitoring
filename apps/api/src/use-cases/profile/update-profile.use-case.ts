/**
 * @file update-profile.use-case.ts
 * @description Use-case : modifier son propre profil.
 *
 * CORRECTION :
 * ✅ userRepository.update() au lieu de .save()
 */

import type { IUserRepository } from '../../domain/repositories/user.repository.js'
import type { UserEntity }      from '../../domain/entities/user.entity.js'
import { NotFoundError, ConflictError } from '../../domain/errors.js'

export type UpdateProfileInput = {
  userId: string
  email?: string
  gsm?:   string
}

export type ProfileDTO = Omit<UserEntity, 'password'>

export async function updateProfileUseCase(
  input: UpdateProfileInput,
  userRepository: IUserRepository
): Promise<ProfileDTO> {
  const user = await userRepository.findById(input.userId)
  if (!user) throw new NotFoundError('Utilisateur')

  // Vérifier l'unicité de l'email si changement
  if (input.email && input.email !== user.email) {
    const existing = await userRepository.findByEmail(input.email)
    if (existing) throw new ConflictError('Cet email est déjà utilisé')
  }

  const updated = await userRepository.update(input.userId, {
    ...(input.email && { email: input.email }),
    ...(input.gsm   !== undefined && { gsm: input.gsm }),
  })

  const { password, ...profile } = updated
  return profile
}