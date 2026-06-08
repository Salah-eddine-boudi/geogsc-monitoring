/**
 * @file me.use-case.ts
 * @description Use-case Me — retourne le profil de l'utilisateur connecté.
 */

import type { IUserRepository } from '../../domain/repositories/user.repository.js'
import { NotFoundError } from '../../domain/errors.js'

export type MeResult = {
  id: string
  nom: string
  prenom: string
  email: string
  role: string
  brigadeId: string | null
}

export async function meUseCase(
  userId: string,
  userRepository: IUserRepository
): Promise<MeResult> {

  const user = await userRepository.findById(userId)

  if (!user || !user.actif) {
    throw new NotFoundError('Utilisateur')
  }

  return {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    brigadeId: user.brigadeId
  }
}