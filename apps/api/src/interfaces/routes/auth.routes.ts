/**
 * @file auth.routes.ts
 * @description Routes HTTP authentification — login et profil courant.
 * Couche interface : reçoit HTTP, valide, appelle les use-cases, retourne JSON.
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { loginUseCase } from '../../use-cases/auth/login.use-case.js'
import { meUseCase } from '../../use-cases/auth/me.use-case.js'
import { UserPrismaRepository } from '../../infrastructure/prisma/repositories/user.prisma.repo.js'
import { requireAuth } from '../plugins/auth.plugin.js'
import type { JwtPayload } from '../../domain/types.js'

// ── IMPORT AUDIT LOG (CORRIGÉ) ──────────────────────────────────────────────
import { createAuditLogUseCase } from '../../use-cases/audit-log/create-audit-log.use-case.js'
import { logger } from '../../infrastructure/logger.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const userRepository = new UserPrismaRepository()

export const authRoutes: FastifyPluginAsync = async (app) => {

  /**
   * POST /auth/login
   */
  app.post('/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body)

    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Données invalides',
        errors: parseResult.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
    }

    const result = await loginUseCase(
      parseResult.data,
      userRepository,
      (payload) => app.jwt.sign(payload, { expiresIn: '8h' })
    )

    // ── FIRE-AND-FORGET : TRACABILITÉ (CORRIGÉ) ─────────────────────────────
    // Conformément au pattern du projet : 1 seul argument !
    createAuditLogUseCase({
      action: 'LOGIN',
      entite: 'USER',
      entiteId: result.user.id,
      userId: result.user.id,
      meta: { 
        ip: request.ip, 
        userAgent: request.headers['user-agent'] 
      }
    }).catch(err => logger.error('Erreur AuditLog Login:', err))
    // ────────────────────────────────────────────────────────────────────────

    return reply.status(200).send({ success: true, ...result })
  })

  /**
   * GET /auth/me
   */
  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const result = await meUseCase(payload.sub, userRepository)
    return reply.status(200).send({ success: true, user: result })
  })
}