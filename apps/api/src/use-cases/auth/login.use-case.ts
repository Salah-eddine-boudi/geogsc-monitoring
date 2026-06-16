/**
 * @file login.use-case.ts
 * @description Use-case Login — ne connaît NI Prisma NI Fastify.
 * Dépend uniquement du contrat IUserRepository.
 */

import bcrypt from 'bcrypt'
import type { IUserRepository } from '../../domain/repositories/user.repository'
import type { JwtPayload } from '../../domain/types.js'
import { UnauthorizedError } from '../../domain/errors.js'

export type LoginInput = {
  email: string
  password: string
}

export type LoginResult = {
  token: string
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
  userRepository: IUserRepository,
  signJwt: (payload: JwtPayload) => string
): Promise<LoginResult> {

  // Étape 1 — cherche via le repository (pas Prisma directement)
  const user = await userRepository.findByEmail(input.email)

  // Étape 2 — utilisateur inexistant ou désactivé
  // Même message pour ne pas révéler si l'email existe (sécurité)
  if (!user || !user.actif) {
    throw new UnauthorizedError()
  }

  // Étape 3 — vérifie le mot de passe
  const passwordValid = await bcrypt.compare(input.password, user.password)
  if (!passwordValid) {
    throw new UnauthorizedError()
  }

  // Étape 4 — signe le JWT
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    brigadeId: user.brigadeId ?? undefined
  }

  const token = signJwt(payload)

  return {
    token,
    user: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      brigadeId: user.brigadeId
    }
  }
}