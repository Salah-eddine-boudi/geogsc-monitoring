/**
 * @file missions.routes.ts
 * @description Routes HTTP pour les missions.
 *
 * ENDPOINTS :
 * GET    /fiches/:ficheId/missions              → liste missions d'une fiche
 * GET    /fiches/:ficheId/missions/:id          → détail mission
 * POST   /fiches/:ficheId/missions              → créer mission (BRIGADE)
 * POST   /fiches/:ficheId/missions/:id/terminer → terminer mission (BRIGADE)
 * PATCH  /fiches/:ficheId/missions/:id          → modifier mission (BRIGADE)
 * DELETE /fiches/:ficheId/missions/:id          → supprimer mission (BRIGADE)
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { createMissionUseCase } from '../../use-cases/missions/create-mission.use-case.js'
import { getMissionsUseCase } from '../../use-cases/missions/get-missions.use-case.js'
import { updateMissionUseCase } from '../../use-cases/missions/update-mission.use-case.js'
import { terminerMissionUseCase } from '../../use-cases/missions/terminer-mission.use-case.js'
import { deleteMissionUseCase } from '../../use-cases/missions/delete-mission.use-case.js'
import { MissionPrismaRepository } from '../../infrastructure/prisma/repositories/mission.prisma.repo.js'
import { FichePrismaRepository } from '../../infrastructure/prisma/repositories/fiche.prisma.repo.js'
import { OuvragePrismaRepository } from '../../infrastructure/prisma/repositories/ouvrage.prisma.repo.js'
import { requireAuth, requireRole } from '../plugins/auth.plugin.js'
import type { JwtPayload } from '../../domain/types.js'
import type { MissionWithRelations } from '../../domain/entities/mission.entity.js'

// ── SCHÉMAS ───────────────────────────────────────────────────────────────────

const createMissionSchema = z.object({
  ouvrageId: z.string().min(1, 'L\'ouvrage est obligatoire'),
  observations: z.string().max(500).optional()
})

const updateMissionSchema = z.object({
  heureDebut: z.coerce.date().optional(),
  observations: z.string().max(500).optional()
})

const terminerMissionSchema = z.object({
  heureFin: z.coerce.date().optional()
  // optionnel → si absent, maintenant est utilisé automatiquement
})

// ── REPOSITORIES ──────────────────────────────────────────────────────────────

const missionRepository = new MissionPrismaRepository()
const ficheRepository = new FichePrismaRepository()
const ouvrageRepository = new OuvragePrismaRepository()

// ── ROUTES ────────────────────────────────────────────────────────────────────

export const missionsRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /fiches/:ficheId/missions
   */
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { ficheId } = request.params as { ficheId: string }

    const missions = await getMissionsUseCase(
      { ficheId, userRole: payload.role, userBrigadeId: payload.brigadeId },
      missionRepository,
      ficheRepository
    )

    return reply.status(200).send({ success: true, missions, total: missions.length })
  })

  /**
   * GET /fiches/:ficheId/missions/:id
   */
  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { ficheId, id } = request.params as { ficheId: string; id: string }

    const missions = await getMissionsUseCase(
      { ficheId, userRole: payload.role, userBrigadeId: payload.brigadeId },
      missionRepository,
      ficheRepository
    )

   const mission = missions.find((m: MissionWithRelations) => m.id === id)
    if (!mission) {
      return reply.status(404).send({
        success: false,
        code: 'NOT_FOUND',
        message: 'Mission introuvable'
      })
    }

    return reply.status(200).send({ success: true, mission })
  })

  /**
   * POST /fiches/:ficheId/missions
   * Crée une nouvelle mission — BRIGADE uniquement
   */
  app.post('/', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { ficheId } = request.params as { ficheId: string }

    const parseResult = createMissionSchema.safeParse(request.body)
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

    const mission = await createMissionUseCase(
      {
        ficheId,
        ouvrageId: parseResult.data.ouvrageId,
        observations: parseResult.data.observations,
        userBrigadeId: payload.brigadeId,
        userRole: payload.role
      },
      missionRepository,
      ficheRepository,
      ouvrageRepository
    )

    return reply.status(201).send({ success: true, mission })
  })

  /**
   * POST /fiches/:ficheId/missions/:id/terminer
   * Termine une mission EN_COURS → TERMINEE
   * BRIGADE uniquement
   */
  app.post('/:id/terminer', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { id } = request.params as { ficheId: string; id: string }

    const parseResult = terminerMissionSchema.safeParse(request.body)
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

    const mission = await terminerMissionUseCase(
      {
        missionId: id,
        userRole: payload.role,
        userBrigadeId: payload.brigadeId,
        heureFin: parseResult.data.heureFin
      },
      missionRepository,
      ficheRepository
    )

    return reply.status(200).send({ success: true, mission })
  })

  /**
   * PATCH /fiches/:ficheId/missions/:id
   * Modifier heureDebut et observations — BRIGADE uniquement
   */
  app.patch('/:id', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { id } = request.params as { ficheId: string; id: string }

    const parseResult = updateMissionSchema.safeParse(request.body)
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

    const mission = await updateMissionUseCase(
      {
        missionId: id,
        userRole: payload.role,
        userBrigadeId: payload.brigadeId,
        ...parseResult.data
      },
      missionRepository,
      ficheRepository
    )

    return reply.status(200).send({ success: true, mission })
  })

  /**
   * DELETE /fiches/:ficheId/missions/:id
   * Supprime une mission — BRIGADE uniquement + fiche BROUILLON
   */
  app.delete('/:id', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { id } = request.params as { ficheId: string; id: string }

    await deleteMissionUseCase(
      { missionId: id, userRole: payload.role, userBrigadeId: payload.brigadeId },
      missionRepository,
      ficheRepository
    )

    return reply.status(200).send({ success: true, message: 'Mission supprimée' })
  })
}