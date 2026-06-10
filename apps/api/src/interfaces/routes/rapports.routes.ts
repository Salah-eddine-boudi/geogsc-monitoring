/**
 * @file rapports.routes.ts
 * @description Routes HTTP pour les rapports mensuels.
 *
 * ENDPOINTS :
 * GET /rapports/:brigadeId/:periode  → rapport mensuel spécifique
 * GET /rapports/:brigadeId           → tous les rapports d'une brigade (année)
 * GET /rapports                      → résumé tous les rapports (IGT/ADMIN)
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { genererRapportUseCase } from '../../use-cases/rapports/generer-rapport.use-case.js'
import { getRapportsBrigadeUseCase } from '../../use-cases/rapports/get-rapports-brigade.use-case.js'
import { requireAuth } from '../plugins/auth.plugin.js'
import type { JwtPayload } from '../../domain/types.js'

const rapportQuerySchema = z.object({
  annee: z.coerce.number().min(2020).max(2100).optional()
})

export const rapportsRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /rapports/:brigadeId/:periode
   * Génère le rapport mensuel d'une brigade pour une période.
   *
   * EXEMPLE : GET /rapports/brigade-01/2026-05
   * → rapport de mai 2026 pour Brigade 01
   */
  app.get('/:brigadeId/:periode', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { brigadeId, periode } = request.params as {
      brigadeId: string
      periode: string
    }

    const rapport = await genererRapportUseCase({
      brigadeId,
      periode,
      userRole: payload.role,
      userId: payload.sub,
      userBrigadeId: payload.brigadeId
    })

    return reply.status(200).send({ success: true, rapport })
  })

  /**
   * GET /rapports/:brigadeId
   * Retourne tous les rapports d'une brigade pour une année.
   *
   * QUERY PARAMS : ?annee=2026
   */
  app.get('/:brigadeId', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { brigadeId } = request.params as { brigadeId: string }

    const parseResult = rapportQuerySchema.safeParse(request.query)
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

    const rapports = await getRapportsBrigadeUseCase({
      brigadeId,
      userRole: payload.role,
      userBrigadeId: payload.brigadeId,
      annee: parseResult.data.annee
    })

    return reply.status(200).send({
      success: true,
      rapports,
      total: rapports.length
    })
  })
}