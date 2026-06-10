/**
 * @file controles.routes.ts
 * @description Routes HTTP pour les contrôles topographiques.
 *
 * ENDPOINTS :
 * GET    /fiches/:ficheId/missions/:missionId/controles       → liste contrôles
 * POST   /fiches/:ficheId/missions/:missionId/controles       → ajouter contrôle (BRIGADE)
 * PATCH  /fiches/:ficheId/missions/:missionId/controles/:id   → modifier contrôle (BRIGADE)
 * DELETE /fiches/:ficheId/missions/:missionId/controles/:id   → supprimer contrôle (BRIGADE)
 *
 * POURQUOI LA BRIGADE SEULEMENT POUR POST/PATCH/DELETE ?
 * C'est la brigade qui effectue les mesures sur le terrain.
 * L'IGT consulte les résultats — il ne les crée pas.
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { createControleUseCase } from '../../use-cases/controles/create-controle.use-case.js'
import { getControlesUseCase } from '../../use-cases/controles/get-controles.use-case.js'
import { updateControleUseCase } from '../../use-cases/controles/update-controle.use-case.js'
import { deleteControleUseCase } from '../../use-cases/controles/delete-controle.use-case.js'
import { ControlePrismaRepository } from '../../infrastructure/prisma/repositories/controle.prisma.repo.js'
import { MissionPrismaRepository } from '../../infrastructure/prisma/repositories/mission.prisma.repo.js'
import { FichePrismaRepository } from '../../infrastructure/prisma/repositories/fiche.prisma.repo.js'
import { requireAuth, requireRole } from '../plugins/auth.plugin.js'
import type { JwtPayload } from '../../domain/types.js'

// ── SCHÉMAS ───────────────────────────────────────────────────────────────────

const createControleSchema = z.object({
  type: z.enum(['IMPLANTATION', 'ALTIMETRIE', 'VERTICALITY', 'RECEPTION', 'CONTRADICTOIRE']),
  ecartX: z.number().optional(),
  ecartY: z.number().optional(),
  ecartZ: z.number().optional(),
  toleranceX: z.number().positive().optional(),
  toleranceY: z.number().positive().optional(),
  toleranceZ: z.number().positive().optional(),
  observations: z.string().max(500).optional()
})

const updateControleSchema = z.object({
  type: z.enum(['IMPLANTATION', 'ALTIMETRIE', 'VERTICALITY', 'RECEPTION', 'CONTRADICTOIRE']).optional(),
  ecartX: z.number().optional(),
  ecartY: z.number().optional(),
  ecartZ: z.number().optional(),
  toleranceX: z.number().positive().optional(),
  toleranceY: z.number().positive().optional(),
  toleranceZ: z.number().positive().optional(),
  observations: z.string().max(500).optional()
})

// ── REPOSITORIES ──────────────────────────────────────────────────────────────

const controleRepository = new ControlePrismaRepository()
const missionRepository = new MissionPrismaRepository()
const ficheRepository = new FichePrismaRepository()

// ── ROUTES ────────────────────────────────────────────────────────────────────

export const controlesRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /fiches/:ficheId/missions/:missionId/controles
   * Liste tous les contrôles d'une mission.
   * ACCÈS : tous les utilisateurs connectés
   */
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { missionId } = request.params as { ficheId: string; missionId: string }

    const controles = await getControlesUseCase(
      { missionId, userRole: payload.role, userBrigadeId: payload.brigadeId },
      controleRepository,
      missionRepository,
      ficheRepository
    )

    return reply.status(200).send({
      success: true,
      controles,
      total: controles.length
    })
  })

  /**
   * POST /fiches/:ficheId/missions/:missionId/controles
   * Crée un nouveau contrôle topographique.
   * Le statut est calculé AUTOMATIQUEMENT selon les écarts et tolérances.
   * ACCÈS : BRIGADE uniquement
   */
  app.post('/', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { missionId } = request.params as { ficheId: string; missionId: string }

    const parseResult = createControleSchema.safeParse(request.body)
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

    const controle = await createControleUseCase(
      {
        missionId,
        ...parseResult.data,
        userBrigadeId: payload.brigadeId,
        userRole: payload.role
      },
      controleRepository,
      missionRepository,
      ficheRepository
    )

    return reply.status(201).send({ success: true, controle })
  })

  /**
   * PATCH /fiches/:ficheId/missions/:missionId/controles/:id
   * Modifie un contrôle existant.
   * Le statut est RECALCULÉ automatiquement.
   * ACCÈS : BRIGADE uniquement
   */
  app.patch('/:id', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { id } = request.params as { ficheId: string; missionId: string; id: string }

    const parseResult = updateControleSchema.safeParse(request.body)
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

    const controle = await updateControleUseCase(
      {
        controleId: id,
        userRole: payload.role,
        userBrigadeId: payload.brigadeId,
        ...parseResult.data
      },
      controleRepository,
      missionRepository,
      ficheRepository
    )

    return reply.status(200).send({ success: true, controle })
  })

  /**
   * DELETE /fiches/:ficheId/missions/:missionId/controles/:id
   * Supprime un contrôle.
   * ACCÈS : BRIGADE uniquement + fiche en BROUILLON
   */
  app.delete('/:id', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { id } = request.params as { ficheId: string; missionId: string; id: string }

    await deleteControleUseCase(
      { controleId: id, userRole: payload.role, userBrigadeId: payload.brigadeId },
      controleRepository,
      missionRepository,
      ficheRepository
    )

    return reply.status(200).send({ success: true, message: 'Contrôle supprimé' })
  })
}