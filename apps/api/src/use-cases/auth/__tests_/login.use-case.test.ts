import bcrypt from 'bcrypt'
import type { IUserRepository } from '../../../domain/repositories/user.repository.js'
import { AppError } from '../../../domain/errors.js'
import { logger, auditLog } from '../../../infrastructure/logger.js'
import { createAuditLog } from '../../../infrastructure/prisma/repositories/audit.prisma.repo.js'

export type LoginInput = {
  email: string
  password: string
}

export type LoginOutput = {
  user: {
    id: string
    nom: string
    prenom: string
    email: string
    role: string
    brigadeId: string | null
  }
}

export async function loginUseCase(
  input: LoginInput,
  userRepository: IUserRepository
): Promise<LoginOutput> {

  // Cherche l'utilisateur par email
  const user = await userRepository.findByEmail(input.email)

  // Message volontairement vague — ne révèle pas si l'email existe
  if (!user || !user.actif) {
    logger.warn({ email: '[redacted]' }, 'Login attempt failed — user not found or inactive')
    throw new AppError('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect', 401)
  }

  // Vérifie le mot de passe avec bcrypt
  const passwordValid = await bcrypt.compare(input.password, user.password)

  if (!passwordValid) {
    logger.warn({ userId: user.id }, 'Login attempt failed — wrong password')
    throw new AppError('INVALID_CREDENTIALS', 'Email ou mot de passe incorrect', 401)
  }

  // ✅ LOG — connexion réussie
  auditLog.auth('LOGIN', user.id, user.role)

  // ✅ AUDIT — enregistre en base de données (fire-and-forget)
  createAuditLog('AUTH_LOGIN', 'User', user.id, user.id, {
    role: user.role
  })

  return {
    user: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      brigadeId: user.brigadeId ?? null
    }
  }
}