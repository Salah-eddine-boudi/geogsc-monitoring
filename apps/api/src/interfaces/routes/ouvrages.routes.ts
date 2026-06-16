/**
 * @file ouvrages.routes.ts
 * @description Routes HTTP pour les ouvrages.
 *
 * ENDPOINTS :
 * GET /ouvrages      → liste tous les ouvrages actifs
 * GET /ouvrages/:id  → détail d'un ouvrage
 *
 * Les ouvrages sont le référentiel des éléments de construction GSC.
 * Ils sont créés par l'ADMIN via seed ou Prisma Studio.
 * Les brigades les consultent pour créer leurs missions.
 */

import type { FastifyPluginAsync } from 'fastify'
import { OuvragePrismaRepository } from '../../infrastructure/prisma/repositories/ouvrage.prisma.repo.js'
import { requireAuth } from '../plugins/auth.plugin.js'

const ouvrageRepository = new OuvragePrismaRepository()

export const ouvragesRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /ouvrages
   * Liste tous les ouvrages actifs.
   * ADMIN peut voir les inactifs avec ?includeInactive=true
   */
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const query = request.query as { includeInactive?: string }
    const includeInactive = query.includeInactive === 'true'

    const ouvrages = await ouvrageRepository.findAll(includeInactive)

    return reply.status(200).send({
      success: true,
      ouvrages,
      total: ouvrages.length
    })
  })

  /**
   * GET /ouvrages/:id
   * Détail d'un ouvrage par ID.
   */
  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const ouvrage = await ouvrageRepository.findById(id)
    if (!ouvrage) {
      return reply.status(404).send({
        success: false,
        code: 'NOT_FOUND',
        message: 'Ouvrage introuvable'
      })
    }

    return reply.status(200).send({ success: true, ouvrage })
  })
}