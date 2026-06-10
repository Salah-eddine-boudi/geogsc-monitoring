/**
 * @file brigades.routes.ts
 * @description Routes HTTP pour les brigades.
 *
 * ENDPOINTS :
 * GET    /brigades          → liste toutes les brigades
 * GET    /brigades/:id      → une brigade avec ses membres
 * POST   /brigades          → créer une brigade (ADMIN)
 * PATCH  /brigades/:id      → modifier une brigade (ADMIN)
 *
 * SÉCURITÉ :
 * Toutes les routes nécessitent un JWT valide (requireAuth).
 * Certaines nécessitent le rôle ADMIN (requireRole).
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getAllBrigadesUseCase } from '../../use-cases/brigades/get-all-brigades.use-case.js'
import { getBrigadeByIdUseCase } from '../../use-cases/brigades/get-brigade-by-id.use-case.js'
import { createBrigadeUseCase } from '../../use-cases/brigades/create-brigade.use-case.js'
import { updateBrigadeUseCase } from '../../use-cases/brigades/update-brigade.use-case.js'
import { BrigadePrismaRepository } from '../../infrastructure/prisma/repositories/brigade.prisma.repo.js'
import { requireAuth, requireRole } from '../plugins/auth.plugin.js'
import type { JwtPayload } from '../../domain/types.js'


const createBrigadeSchema = z.object({
  nom: z.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  chef: z.string()
    .min(3, 'Le nom du chef doit contenir au moins 3 caractères')
    .max(100, 'Le nom du chef ne peut pas dépasser 100 caractères')
})

// Schéma de validation pour la modification
// Tous les champs sont optionnels — PATCH partiel
const updateBrigadeSchema = z.object({
  nom: z.string().min(3).max(50).optional(),
  chef: z.string().min(3).max(100).optional(),
  actif: z.boolean().optional()
})
// Instance unique du repository — partagée entre toutes les routes
const brigadeRepository = new BrigadePrismaRepository()

export const brigadesRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /brigades
   * Liste toutes les brigades selon le rôle de l'utilisateur.
   *
   * ACCÈS : tous les utilisateurs connectés
   *
   * RÉPONSE :
   * {
   *   "success": true,
   *   "brigades": [...],
   *   "total": 4
   * }
   */
  app.get(
    '/',
    { preHandler: requireAuth },
    async (request, reply) => {
     
      const payload = request.user as JwtPayload

      const result = await getAllBrigadesUseCase(
        { role: payload.role },
        brigadeRepository
      )

      return reply.status(200).send({ success: true, ...result })
    }
  )

  /**
   * GET /brigades/:id
   * Retourne une brigade avec ses membres.
   *
   * ACCÈS :
   * - ADMIN/IGT → n'importe quelle brigade
   * - BRIGADE   → seulement SA brigade
   *
   * PARAMÈTRE URL : :id = identifiant de la brigade
   *
   * RÉPONSE :
   * {
   *   "success": true,
   *   "brigade": { id, nom, chef, actif, membres: [...] }
   * }
   */
  app.get(
    '/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const payload = request.user as JwtPayload

     
      const { id } = request.params as { id: string }

      const brigade = await getBrigadeByIdUseCase(
        {
          brigadeId: id,
          userRole: payload.role,
          userBrigadeId: payload.brigadeId
        },
        brigadeRepository
      )

      return reply.status(200).send({ success: true, brigade })
    }
  )

  /**
   * POST /brigades
   * Crée une nouvelle brigade.
   *
   * ACCÈS : ADMIN uniquement
   *
   * BODY :
   * { "nom": "Équipe 05", "chef": "M. BENALI Ahmed" }
   *
   * RÉPONSE 201 :
   * { "success": true, "brigade": { id, nom, chef, actif, createdAt } }
   */
  app.post(
    '/',
    { preHandler: requireRole('ADMIN') },
    // requireRole('ADMIN') → vérifie JWT + vérifie role === 'ADMIN'
    async (request, reply) => {

      // Valide le body avec Zod
      const parseResult = createBrigadeSchema.safeParse(request.body)
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

      const brigade = await createBrigadeUseCase(
        parseResult.data,
        brigadeRepository
      )

      // 201 Created → convention REST pour une création réussie
      return reply.status(201).send({ success: true, brigade })
    }
  )

  /**
   * PATCH /brigades/:id
   * Modifie partiellement une brigade.
   *
   * ACCÈS : ADMIN uniquement
   *
   * BODY (tous optionnels) :
   * { "chef": "M. RACHIDI" }
   * { "actif": false }
   * { "nom": "Équipe 05", "chef": "M. BENALI" }
   *
   * RÉPONSE 200 :
   * { "success": true, "brigade": { ...brigade mise à jour } }
   */
  app.patch(
    '/:id',
    { preHandler: requireRole('ADMIN') },
    async (request, reply) => {
      const { id } = request.params as { id: string }

      const parseResult = updateBrigadeSchema.safeParse(request.body)
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

      const brigade = await updateBrigadeUseCase(
        { id, ...parseResult.data },
        brigadeRepository
      )

      return reply.status(200).send({ success: true, brigade })
    }
  )
}