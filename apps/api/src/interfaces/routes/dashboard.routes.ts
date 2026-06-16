/**
 * @file dashboard.routes.ts
 * @description Routes HTTP pour le Dashboard IGT.
 *
 * ENDPOINTS :
 * GET /dashboard/stats          → stats du mois courant, toutes brigades
 * GET /dashboard/stats?periode=2026-06              → mois spécifique
 * GET /dashboard/stats?periode=2026-06&brigadeId=xx → filtre brigade
 *
 * RBAC :
 * → BRIGADE → 403 automatique (géré dans le use-case)
 * → IGT / ADMIN → accès complet
 *
 * PATTERN : identique à rapports.routes.ts
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getDashboardStatsUseCase } from '../../use-cases/dashboard/get-dashboard-stats.use-case.js'
import { requireAuth } from '../plugins/auth.plugin.js'
import type { JwtPayload } from '../../domain/types.js'

// ─── SCHÉMA ZOD ───────────────────────────────────────────────────

/**
 * Validation des query params.
 * periode : "YYYY-MM" — regex stricte pour éviter les injections
 * brigadeId : UUID optionnel
 */
const dashboardQuerySchema = z.object({
  periode: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Format attendu : YYYY-MM (ex: 2026-06)')
    .optional(),
  brigadeId: z
    .string()
    .uuid('brigadeId doit être un UUID valide')
    .optional()
})

// ─── ROUTES ───────────────────────────────────────────────────────

export const dashboardRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /dashboard/stats
   *
   * EXEMPLES D'APPEL :
   * → /dashboard/stats                          → mois courant, toutes brigades
   * → /dashboard/stats?periode=2026-05          → mai 2026, toutes brigades
   * → /dashboard/stats?brigadeId=uuid-brigade-a → mois courant, Brigade A seule
   * → /dashboard/stats?periode=2026-05&brigadeId=uuid → combiné
   */
  app.get('/stats', { preHandler: requireAuth }, async (request, reply) => {

    // Récupère les infos JWT de l'utilisateur connecté
    const payload = request.user as JwtPayload

    // Validation des query params avec Zod
    // Si invalide → 400 avec message clair (pattern identique rapports.routes.ts)
    const parseResult = dashboardQuerySchema.safeParse(request.query)
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Paramètres invalides',
        errors: parseResult.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
    }

    // Le use-case gère la logique métier + le 403 si BRIGADE
    // try/catch global géré par error-handler.ts
    const stats = await getDashboardStatsUseCase({
      userRole:  payload.role,
      periode:   parseResult.data.periode,
      brigadeId: parseResult.data.brigadeId
    })

    return reply.status(200).send({
      success: true,
      stats
    })
  })
}