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

// ── SCHÉMAS DE VALIDATION ────────────────────────────────────────────────────

/**
 * Schéma création fiche.
 * date → z.coerce.date() convertit automatiquement "2026-06-08" en Date
 */
const createFicheSchema = z.object({
  date: z.coerce.date(),
  // z.coerce.date() → accepte string ISO "2026-06-08" et convertit en Date
  // sans coerce → erreur si on envoie une string au lieu d'un objet Date
  observations: z.string().max(500).optional()
})

/**
 * Schéma pour les filtres de liste.
 * Tous les paramètres viennent de l'URL : GET /fiches?statut=SOUMISE&page=2
 */
const getFichesSchema = z.object({
  brigadeId: z.string().optional(),
  statut: z.enum(['BROUILLON', 'SOUMISE', 'VALIDEE', 'REJETEE']).optional(),
  dateDebut: z.coerce.date().optional(),
  dateFin: z.coerce.date().optional(),
  page: z.coerce.number().min(1).optional(),
  // z.coerce.number() → convertit "2" (string URL) en 2 (number)
  limit: z.coerce.number().min(1).max(100).optional()
})

/**
 * Schéma rejet — motif obligatoire.
 */
const rejeterSchema = z.object({
  motif: z.string()
    .min(10, 'Le motif doit contenir au moins 10 caractères')
    .max(500, 'Le motif ne peut pas dépasser 500 caractères')
})

/**
 * Schéma modification observations.
 */
const updateFicheSchema = z.object({
  observations: z.string().max(500).optional()
})



const ficheRepository = new FichePrismaRepository()
const brigadeRepository = new BrigadePrismaRepository()



export const fichesRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /fiches
   * Liste les fiches avec filtres et pagination.
   *
   * QUERY PARAMS : ?brigadeId=xxx&statut=SOUMISE&page=1&limit=20
   *
   * ACCÈS : tous les utilisateurs connectés
   * BRIGADE → voit seulement ses fiches (forcé dans le use-case)
   * IGT/ADMIN → voit toutes les fiches
   */
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

  /**
   * GET /fiches/:id
   * Retourne une fiche complète avec missions et contrôles.
   */
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

  /**
   * POST /fiches
   * Crée une nouvelle fiche journalière.
   *
   * ACCÈS : BRIGADE uniquement
   * Body : { date: "2026-06-08", observations?: "..." }
   */
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

      // brigadeId vient du JWT — pas du body
      // Sécurité : on ne fait pas confiance au body pour ça
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
          // brigadeId depuis le JWT — jamais depuis le body
          createurId: payload.sub,
          observations: parseResult.data.observations
        },
        ficheRepository,
        brigadeRepository
      )

      return reply.status(201).send({ success: true, fiche })
    }
  )

  /**
   * POST /fiches/:id/soumettre
   * Soumet une fiche pour validation IGT.
   *
   * ACCÈS : BRIGADE uniquement
   * Pas de body nécessaire — l'action est claire
   */
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

      return reply.status(200).send({ success: true, fiche })
    }
  )

  /**
   * POST /fiches/:id/valider
   * Valide une fiche soumise.
   *
   * ACCÈS : IGT et ADMIN uniquement
   */
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
          // pas de motif pour la validation
        },
        ficheRepository
      )

      return reply.status(200).send({ success: true, fiche })
    }
  )

  /**
   * POST /fiches/:id/rejeter
   * Rejette une fiche soumise avec un motif obligatoire.
   *
   * ACCÈS : IGT et ADMIN uniquement
   * Body : { motif: "Mission 2 : écart Z non documenté" }
   */
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

      return reply.status(200).send({ success: true, fiche })
    }
  )

  /**
   * PATCH /fiches/:id
   * Modifie les observations d'une fiche BROUILLON.
   *
   * ACCÈS : BRIGADE uniquement
   * Impossible si fiche SOUMISE/VALIDEE/REJETEE
   */
  app.patch(
    '/:id',
    { preHandler: requireRole('BRIGADE') },
    async (request, reply) => {
      const payload = request.user as JwtPayload
      const { id } = request.params as { id: string }

      // Vérifie d'abord que la fiche appartient à cette brigade
      const fiche = await getFicheByIdUseCase(
        {
          ficheId: id,
          userRole: payload.role,
          userBrigadeId: payload.brigadeId
        },
        ficheRepository
      )

      // Vérifie que la fiche est en BROUILLON
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
      return reply.status(200).send({ success: true, fiche: ficheMaj })
    }
  )
}