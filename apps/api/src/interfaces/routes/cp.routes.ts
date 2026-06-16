/**
 * @file cp.routes.ts
 * @description Routes HTTP pour les Comptes Rendus CP.
 *
 * ENDPOINTS :
 * GET  /cp/:brigadeId              → liste CPs d'une brigade
 * GET  /cp/:brigadeId/:id          → détail CP
 * POST /cp                         → créer CP
 * POST /cp/:id/evenements          → ajouter événement
 * POST /cp/:id/vigilances          → ajouter point vigilance
 * POST /cp/:id/soumettre           → soumettre CP
 * DELETE /cp/:id/evenements/:evId  → supprimer événement
 * DELETE /cp/:id/vigilances/:vId   → supprimer vigilance
 */

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { requireAuth, requireRole } from '../plugins/auth.plugin.js'
import { createCPUseCase } from '../../use-cases/cp/create-cp.use-case.js'
import { getCPsBrigadeUseCase, getCPByIdUseCase } from '../../use-cases/cp/get-cp.use-case.js'
import { addEvenementUseCase } from '../../use-cases/cp/add-evenement.use-case.js'
import { addVigilanceUseCase } from '../../use-cases/cp/add-vigilance.use-case.js'
import { soumettreCP } from '../../use-cases/cp/soumettre-cp.use-case.js'
import { prisma } from '../../infrastructure/prisma/prisma.js'
import { AppError } from '../../domain/errors.js'
import type { JwtPayload } from '../../domain/types.js'

// ── SCHÉMAS ───────────────────────────────────────────────────────

const createCPSchema = z.object({
  semaine:     z.number().int().min(1).max(53),
  annee:       z.number().int().min(2025).max(2030),
  brigadeId:   z.string().min(1),
  observations: z.string().max(1000).optional()
})

const evenementSchema = z.object({
  date:         z.coerce.date(),
  type:         z.enum(['VISITE_CHANTIER', 'REUNION', 'INCIDENT', 'CONSTAT', 'AUTRE']),
  description:  z.string().min(1).max(500),
  participants: z.string().max(300).optional(),
  lieu:         z.string().max(100).optional()
})

const vigilanceSchema = z.object({
  criticite:   z.enum(['HAUTE', 'MOYENNE', 'FAIBLE']),
  description: z.string().min(1).max(500),
  action:      z.string().max(300).optional(),
  responsable: z.string().max(100).optional(),
  echeance:    z.coerce.date().optional()
})

// ── ROUTES ────────────────────────────────────────────────────────

export const cpRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /cp/:brigadeId
   * Liste tous les CPs d'une brigade pour une année.
   */
  app.get('/:brigadeId', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { brigadeId } = request.params as { brigadeId: string }
    const query = request.query as { annee?: string }
    const annee = query.annee ? Number(query.annee) : new Date().getFullYear()

    const cps = await getCPsBrigadeUseCase(
      brigadeId, annee, payload.role, payload.brigadeId
    )

    return reply.status(200).send({ success: true, cps, total: cps.length })
  })

  /**
   * GET /cp/:brigadeId/:id
   * Détail d'un CP.
   */
  app.get('/:brigadeId/:id', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { id } = request.params as { brigadeId: string; id: string }

    const cp = await getCPByIdUseCase(id, payload.role, payload.brigadeId)
    return reply.status(200).send({ success: true, cp })
  })

  /**
   * POST /cp
   * Crée un nouveau CP hebdomadaire.
   */
  app.post('/', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload

    const parseResult = createCPSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false, code: 'VALIDATION_ERROR',
        errors: parseResult.error.issues.map(e => ({
          field: e.path.join('.'), message: e.message
        }))
      })
    }

    const cp = await createCPUseCase({
      ...parseResult.data,
      createurId: payload.sub,
      userBrigadeId: payload.brigadeId,
      userRole: payload.role
    })

    return reply.status(201).send({ success: true, cp })
  })

  /**
   * POST /cp/:id/evenements
   * Ajoute un événement à un CP.
   */
  app.post('/:id/evenements', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { id } = request.params as { id: string }

    const parseResult = evenementSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false, code: 'VALIDATION_ERROR',
        errors: parseResult.error.issues.map(e => ({
          field: e.path.join('.'), message: e.message
        }))
      })
    }

    const evenement = await addEvenementUseCase({
      cpId: id,
      ...parseResult.data,
      userRole: payload.role,
      userBrigadeId: payload.brigadeId
    })

    return reply.status(201).send({ success: true, evenement })
  })

  /**
   * POST /cp/:id/vigilances
   * Ajoute un point de vigilance.
   */
  app.post('/:id/vigilances', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { id } = request.params as { id: string }

    const parseResult = vigilanceSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false, code: 'VALIDATION_ERROR',
        errors: parseResult.error.issues.map(e => ({
          field: e.path.join('.'), message: e.message
        }))
      })
    }

    const vigilance = await addVigilanceUseCase({
      cpId: id,
      ...parseResult.data,
      userRole: payload.role,
      userBrigadeId: payload.brigadeId
    })

    return reply.status(201).send({ success: true, vigilance })
  })

  /**
   * POST /cp/:id/soumettre
   * Soumet le CP pour validation IGT.
   */
  app.post('/:id/soumettre', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { id } = request.params as { id: string }

    const cp = await soumettreCP(id, payload.role, payload.brigadeId)
    return reply.status(200).send({ success: true, cp })
  })

  /**
   * DELETE /cp/:id/evenements/:evId
   * Supprime un événement.
   */
  app.delete('/:id/evenements/:evId', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const { id, evId } = request.params as { id: string; evId: string }

    const cp = await prisma.compteRenduCP.findUnique({ where: { id } })
    if (!cp) throw new AppError('NOT_FOUND', 'CP introuvable', 404)
    if (cp.statut !== 'BROUILLON') {
      throw new AppError('STATUT_INVALIDE', 'CP déjà soumis', 400)
    }

    await prisma.evenementCP.delete({ where: { id: evId } })
    return reply.status(200).send({ success: true })
  })

  /**
   * DELETE /cp/:id/vigilances/:vId
   * Supprime un point de vigilance.
   */
  app.delete('/:id/vigilances/:vId', { preHandler: requireRole('BRIGADE') }, async (request, reply) => {
    const { id, vId } = request.params as { id: string; vId: string }

    const cp = await prisma.compteRenduCP.findUnique({ where: { id } })
    if (!cp) throw new AppError('NOT_FOUND', 'CP introuvable', 404)
    if (cp.statut !== 'BROUILLON') {
      throw new AppError('STATUT_INVALIDE', 'CP déjà soumis', 400)
    }

    await prisma.pointVigilanceCP.delete({ where: { id: vId } })
    return reply.status(200).send({ success: true })
  })
}