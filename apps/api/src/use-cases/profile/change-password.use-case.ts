/**
 * @file change-password.use-case.ts
 * @description Use-case : changer son mot de passe.
 *
 * CORRECTION :
 * ✅ revokeTokens : callback au lieu d'un repository dédié
 *    → évite de créer IRefreshTokenRepository pour un seul besoin
 */

import bcrypt from 'bcrypt'
import type { IUserRepository } from '../../domain/repositories/user.repository.js'
import { NotFoundError, AppError } from '../../domain/errors.js'

export type ChangePasswordInput = {
  userId:            string
  motDePasseActuel:  string
  nouveauMotDePasse: string
}

const BCRYPT_ROUNDS = 12

export async function changePasswordUseCase(
  input: ChangePasswordInput,
  userRepository: IUserRepository,
  revokeTokens:   (userId: string) => Promise<void>
): Promise<void> {
  const user = await userRepository.findById(input.userId)
  if (!user) throw new NotFoundError('Utilisateur')

  // Vérifier le mot de passe actuel
  const valide = await bcrypt.compare(input.motDePasseActuel, user.password)
  if (!valide) {
    throw new AppError('MOT_DE_PASSE_INVALIDE', 'Mot de passe actuel incorrect', 400)
  }

  // Valider le nouveau
  if (input.nouveauMotDePasse.length < 8) {
    throw new AppError('MOT_DE_PASSE_TROP_COURT', 'Minimum 8 caractères requis', 400)
  }
  if (input.nouveauMotDePasse === input.motDePasseActuel) {
    throw new AppError('MOT_DE_PASSE_IDENTIQUE', 'Le nouveau mot de passe doit être différent', 400)
  }

  // Hacher et sauvegarder
  const hash = await bcrypt.hash(input.nouveauMotDePasse, BCRYPT_ROUNDS)
  await userRepository.update(input.userId, { password: hash })

  // Révoquer tous les refresh tokens (déconnexion multi-device)
  await revokeTokens(input.userId)
}