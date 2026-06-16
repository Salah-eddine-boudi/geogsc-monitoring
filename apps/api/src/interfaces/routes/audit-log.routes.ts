/**
 * @file audit-log.routes.ts
 * @description Routes HTTP pour le journal d'audit.
 *
 * ENDPOINTS :
 * GET /audit-logs                    → liste paginée avec filtres
 * GET /audit-logs/:entiteId          → logs d'une entité spécifique
 *
 * RBAC : IGT et ADMIN uniquement (géré dans le use-case)
 *
 * PATTERN : identique à rapports.routes.ts et dashboard.routes.ts
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getAuditLogsUseCase }    from '../../use-cases/audit-log/get-audit-logs.use-case.js'
import { requireAuth }            from '../plugins/auth.plugin.js'
import type { JwtPayload, Role } from '../../domain/types.js'

// ─── SCHÉMA ZOD — QUERY PARAMS ────────────────────────────────────

/**
 * Validation des paramètres de requête.
 *
 * z.coerce.number() : convertit la string "1" en number 1
 * car les query params HTTP sont toujours des strings.
 *
 * .default(1) : valeur par défaut si le param est absent.
 */
const auditLogQuerySchema = z.object({
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(20),
  entiteId:  z.string().optional(),
  userId:    z.string().optional(),
  action:    z.string().optional(),
  dateDebut: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD')
    .optional(),
  dateFin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD')
    .optional()
})

// ─── ROUTES ───────────────────────────────────────────────────────

export const auditLogRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /audit-logs
   * Liste paginée du journal d'audit avec filtres optionnels.
   *
   * EXEMPLES D'APPEL :
   * → /audit-logs                              → 20 derniers logs
   * → /audit-logs?action=VALIDER_FICHE         → toutes les validations
   * → /audit-logs?entiteId=cmx...              → logs d'une fiche précise
   * → /audit-logs?userId=cmx...&page=2         → actions d'un utilisateur
   * → /audit-logs?dateDebut=2026-06-01&dateFin=2026-06-30 → juin 2026
   */
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {

    const payload = request.user as JwtPayload

    // Validation des query params
    const parseResult = auditLogQuerySchema.safeParse(request.query)
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

    const result = await getAuditLogsUseCase({
      userRole:  payload.role as Role,
      ...parseResult.data
    })

    return reply.status(200).send({
      success: true,
      ...result
    })
  })

  /**
   * GET /audit-logs/entite/:entiteId
   * Raccourci pour voir tous les logs d'une entité spécifique.
   *
   * EXEMPLE :
   * GET /audit-logs/entite/cmq6gtegy00038trwvb4641cn
   * → tous les logs de la fiche cmq6gtegy...
   *
   * CAS D'USAGE MÉTIER GSC :
   * L'IGT veut savoir tout ce qui s'est passé sur une fiche :
   * création, soumission, rejet, correction, re-soumission, validation
   */
  app.get('/entite/:entiteId', { preHandler: requireAuth }, async (request, reply) => {

    const payload  = request.user as JwtPayload
    const { entiteId } = request.params as { entiteId: string }

    const parseResult = auditLogQuerySchema.safeParse(request.query)
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

    const result = await getAuditLogsUseCase({
      userRole: payload.role as Role,
      entiteId,
      ...parseResult.data
    })

    return reply.status(200).send({
      success: true,
      ...result
    })
  })
}