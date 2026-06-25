/**
 * @file profile.routes.ts
 * @description Routes HTTP du profil utilisateur.
 *
 * CORRECTIONS :
 * ✅ payload.sub au lieu de payload.userId (conforme à JwtPayload existant)
 * ✅ RefreshTokenRepository retiré — révocation gérée via prisma direct
 */

import type { FastifyPluginAsync } from 'fastify'
import { z }                      from 'zod'
import { requireAuth }            from '../plugins/auth.plugin.js'
import { UserPrismaRepository }   from '../../infrastructure/prisma/repositories/user.prisma.repo.js'
import { getProfileUseCase }      from '../../use-cases/profile/get-profile.use-case.js'
import { updateProfileUseCase }   from '../../use-cases/profile/update-profile.use-case.js'
import { changePasswordUseCase }  from '../../use-cases/profile/change-password.use-case.js'
import { prisma }                 from '../../infrastructure/prisma/prisma.js'
import type { JwtPayload }        from '../../domain/types.js'

// ─── SCHÉMAS ZOD ─────────────────────────────────────────────────

const updateProfileSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  gsm:   z.string().regex(/^\+?[0-9\s\-]{8,15}$/, 'Numéro invalide').optional(),
}).refine(data => data.email || data.gsm, {
  message: 'Au moins un champ requis (email ou gsm)',
})

const changePasswordSchema = z.object({
  motDePasseActuel:  z.string().min(1, 'Mot de passe actuel requis'),
  nouveauMotDePasse: z.string().min(8, 'Minimum 8 caractères'),
  confirmation:      z.string().min(1, 'Confirmation requise'),
}).refine(data => data.nouveauMotDePasse === data.confirmation, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmation'],
})

// ─── REPOSITORY ──────────────────────────────────────────────────

const userRepository = new UserPrismaRepository()

// ─── ROUTES ──────────────────────────────────────────────────────

export const profileRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /profile
   */
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload

    const profile = await getProfileUseCase(payload.sub, userRepository)

    return reply.status(200).send({ success: true, profile })
  })

  /**
   * PATCH /profile
   */
  app.patch('/', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload

    const parseResult = updateProfileSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        code:    'VALIDATION_ERROR',
        message: 'Données invalides',
        errors:  parseResult.error.issues.map(e => ({
          field: e.path.join('.'), message: e.message,
        })),
      })
    }

    const profile = await updateProfileUseCase(
      { userId: payload.sub, ...parseResult.data },
      userRepository
    )

    return reply.status(200).send({ success: true, profile })
  })

  /**
   * POST /profile/password
   * Révoque les refresh tokens via Prisma directement (pas de repo dédié).
   */
  app.post('/password', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload

    const parseResult = changePasswordSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        code:    'VALIDATION_ERROR',
        message: 'Données invalides',
        errors:  parseResult.error.issues.map(e => ({
          field: e.path.join('.'), message: e.message,
        })),
      })
    }

    await changePasswordUseCase(
      {
        userId:            payload.sub,
        motDePasseActuel:  parseResult.data.motDePasseActuel,
        nouveauMotDePasse: parseResult.data.nouveauMotDePasse,
      },
      userRepository,
      // Révocation refresh tokens inline — pas besoin d'un repo dédié
      async (userId: string) => {
        await prisma.refreshToken.updateMany({
          where: { userId, revoked: false },
          data:  { revoked: true },
        })
      }
    )

    return reply.status(200).send({
      success: true,
      message: 'Mot de passe modifié. Reconnectez-vous sur vos autres appareils.',
    })
  })
}