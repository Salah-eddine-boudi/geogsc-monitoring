/**
 * @file fiches.routes.ts
 * @description Routes HTTP pour les fiches journalières.
 *
 * ENDPOINTS :
 * GET    /fiches                    → liste avec filtres
 * GET    /fiches/:id                → une fiche complète
 * POST   /fiches                    → créer une fiche (BRIGADE)
 * POST   /fiches/:id/soumettre      → soumettre (BRIGADE)
 * POST   /fiches/:id/valider        → valider (IGT/ADMIN)
 * POST   /fiches/:id/rejeter        → rejeter (IGT/ADMIN)
 * PATCH  /fiches/:id                → modifier observations (BRIGADE)
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { createFicheUseCase } from '../../use-cases/fiches/create-fiche.use-case.js'
import { getFichesUseCase } from '../../use-cases/fiches/get-fiches.use-case.js'
import { getFicheByIdUseCase } from '../../use-cases/fiches/get-fiche-by-id.use-case.js'
import { soumettreUseCase } from '../../use-cases/fiches/soumettre-fiche.use-case.js'
import { validerFicheUseCase } from '../../use-cases/fiches/valider-fiche.use-case.js'
import { FichePrismaRepository } from '../../infrastructure/prisma/repositories/fiche.prisma.repo.js'
import { BrigadePrismaRepository } from '../../infrastructure/prisma/repositories/brigade.prisma.repo.js'
import { requireAuth, requireRole } from '../plugins/auth.plugin.js'
import type { JwtPayload } from '../../domain/types.js'

// ── IMPORTS AUDIT LOG (AJOUTÉS) ──────────────────────────────────────────────
import { createAuditLogUseCase } from '../../use-cases/audit-log/create-audit-log.use-case.js'
import { logger } from '../../infrastructure/logger.js'

// ── SCHÉMAS DE VALIDATION ────────────────────────────────────────────────────
const createFicheSchema = z.object({
  date: z.coerce.date(),
  observations: z.string().max(500).optional()
})

const getFichesSchema = z.object({
  brigadeId: z.string().optional(),
  statut: z.enum(['BROUILLON', 'SOUMISE', 'VALIDEE', 'REJETEE']).optional(),
  dateDebut: z.coerce.date().optional(),
  dateFin: z.coerce.date().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional()
})

const rejeterSchema = z.object({
  motif: z.string()
    .min(10, 'Le motif doit contenir au moins 10 caractères')
    .max(500, 'Le motif ne peut pas dépasser 500 caractères')
})

const updateFicheSchema = z.object({
  observations: z.string().max(500).optional()
})

// ── INSTANCES REPOSITORIES ────────────────────────────────────────────────────
const ficheRepository = new FichePrismaRepository()
const brigadeRepository = new BrigadePrismaRepository()

// ── ROUTES ────────────────────────────────────────────────────────────────────
export const fichesRoutes: FastifyPluginAsync = async (app) => {

  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const parseResult = getFichesSchema.safeParse(request.query)
    
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

    const result = await getFichesUseCase(
      {
        userRole: payload.role,
        userBrigadeId: payload.brigadeId,
        filters: parseResult.data
      },
      ficheRepository
    )

    return reply.status(200).send({ success: true, ...result })
  })

  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { id } = request.params as { id: string }

    const fiche = await getFicheByIdUseCase(
      {
        ficheId: id,
        userRole: payload.role,
        userBrigadeId: payload.brigadeId
      },
      ficheRepository
    )

    return reply.status(200).send({ success: true, fiche })
  })

  app.post(
    '/',
    { preHandler: requireRole('BRIGADE') },
    async (request, reply) => {
      const payload = request.user as JwtPayload
      const parseResult = createFicheSchema.safeParse(request.body)
      
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

      if (!payload.brigadeId) {
        return reply.status(400).send({
          success: false,
          code: 'BRIGADE_REQUIRED',
          message: 'Utilisateur non associé à une brigade'
        })
      }

      const fiche = await createFicheUseCase(
        {
          date: parseResult.data.date,
          brigadeId: payload.brigadeId,
          createurId: payload.sub,
          observations: parseResult.data.observations
        },
        ficheRepository,
        brigadeRepository
      )

      // ── AUDIT : CRÉATION (AJOUTÉ) ─────────────────────────────────────────
      createAuditLogUseCase({
        action: 'CREATE_FICHE',
        entite: 'FICHE_JOURNALIERE',
        entiteId: fiche.id,
        userId: payload.sub,
        meta: { date: fiche.date }
      }).catch(err => logger.error('AuditLog Error:', err))

      return reply.status(201).send({ success: true, fiche })
    }
  )

  app.post(
    '/:id/soumettre',
    { preHandler: requireRole('BRIGADE') },
    async (request, reply) => {
      const payload = request.user as JwtPayload
      const { id } = request.params as { id: string }

      const fiche = await soumettreUseCase(
        {
          ficheId: id,
          userId: payload.sub,
          userBrigadeId: payload.brigadeId
        },
        ficheRepository
      )

      // ── AUDIT : SOUMISSION (AJOUTÉ) ───────────────────────────────────────
      createAuditLogUseCase({
        action: 'SOUMETTRE_FICHE',
        entite: 'FICHE_JOURNALIERE',
        entiteId: fiche.id,
        userId: payload.sub
      }).catch(err => logger.error('AuditLog Error:', err))

      return reply.status(200).send({ success: true, fiche })
    }
  )

  app.post(
    '/:id/valider',
    { preHandler: requireRole('IGT', 'ADMIN') },
    async (request, reply) => {
      const payload = request.user as JwtPayload
      const { id } = request.params as { id: string }

      const fiche = await validerFicheUseCase(
        {
          ficheId: id,
          action: 'VALIDER',
          validateurId: payload.sub
        },
        ficheRepository
      )

      // ── AUDIT : VALIDATION (AJOUTÉ) ───────────────────────────────────────
      createAuditLogUseCase({
        action: 'VALIDER_FICHE',
        entite: 'FICHE_JOURNALIERE',
        entiteId: fiche.id,
        userId: payload.sub
      }).catch(err => logger.error('AuditLog Error:', err))

      return reply.status(200).send({ success: true, fiche })
    }
  )

  app.post(
    '/:id/rejeter',
    { preHandler: requireRole('IGT', 'ADMIN') },
    async (request, reply) => {
      const payload = request.user as JwtPayload
      const { id } = request.params as { id: string }

      const parseResult = rejeterSchema.safeParse(request.body)
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Motif invalide',
          errors: parseResult.error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        })
      }

      const fiche = await validerFicheUseCase(
        {
          ficheId: id,
          action: 'REJETER',
          validateurId: payload.sub,
          motif: parseResult.data.motif
        },
        ficheRepository
      )

      // ── AUDIT : REJET (AJOUTÉ) ────────────────────────────────────────────
      createAuditLogUseCase({
        action: 'REJETER_FICHE',
        entite: 'FICHE_JOURNALIERE',
        entiteId: fiche.id,
        userId: payload.sub,
        meta: { motif: parseResult.data.motif }
      }).catch(err => logger.error('AuditLog Error:', err))

      return reply.status(200).send({ success: true, fiche })
    }
  )

  app.patch(
    '/:id',
    { preHandler: requireRole('BRIGADE') },
    async (request, reply) => {
      const payload = request.user as JwtPayload
      const { id } = request.params as { id: string }

      const fiche = await getFicheByIdUseCase(
        {
          ficheId: id,
          userRole: payload.role,
          userBrigadeId: payload.brigadeId
        },
        ficheRepository
      )

      if (fiche.statut !== 'BROUILLON') {
        return reply.status(400).send({
          success: false,
          code: 'STATUT_INVALIDE',
          message: `Impossible de modifier une fiche en statut "${fiche.statut}"`
        })
      }

      const parseResult = updateFicheSchema.safeParse(request.body)
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

      const ficheMaj = await ficheRepository.update(id, parseResult.data)

      // ── AUDIT : MISE À JOUR (AJOUTÉ) ──────────────────────────────────────
      createAuditLogUseCase({
        action: 'UPDATE_FICHE',
        entite: 'FICHE_JOURNALIERE',
        entiteId: ficheMaj.id,
        userId: payload.sub,
        meta: { observationsUpdated: !!parseResult.data.observations }
      }).catch(err => logger.error('AuditLog Error:', err))

      return reply.status(200).send({ success: true, fiche: ficheMaj })
    }
  )
}