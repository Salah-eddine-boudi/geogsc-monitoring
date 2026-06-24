/**
 * @file export.routes.ts
 * @description Routes export Excel — fichier cumulatif par brigade.
 *
 * ENDPOINTS :
 * GET /export/excel/:brigadeId
 * → Télécharge le fichier Excel complet de la brigade
 * → Un onglet par mois depuis le début du projet
 * → Nom fichier : "Rapport_Topo_GSC_Equipe01.xlsx"
 */

import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../plugins/auth.plugin.js'
import { exporterRapportExcelUseCase } from '../../use-cases/export/exporter-rapport-excel.use-case.js'
import { AppError } from '../../domain/errors.js'
import type { JwtPayload } from '../../domain/types.js'
import { prisma } from '../../infrastructure/prisma/prisma.js'

export const exportRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /export/excel/:brigadeId
   * Télécharge le fichier Excel cumulatif de la brigade.
   */
  app.get('/excel/:brigadeId', {
    preHandler: requireAuth
  }, async (request, reply) => {

    const payload   = request.user as JwtPayload
    const { brigadeId } = request.params as { brigadeId: string }

    // RBAC : Brigade → seulement ses propres données
    if (payload.role === 'BRIGADE' && payload.brigadeId !== brigadeId) {
      throw new AppError('FORBIDDEN', 'Accès interdit', 403)
    }

    const brigade = await prisma.brigade.findUnique({
      where: { id: brigadeId },
      select: { nom: true }
    })
    if (!brigade) throw new AppError('NOT_FOUND', 'Brigade introuvable', 404)

    const buffer = await exporterRapportExcelUseCase(brigadeId)

    // Nom fichier : "Rapport_Topo_GSC_Equipe01.xlsx"
    const nomSanitize = brigade.nom.replace(/[^a-zA-Z0-9]/g, '_')
    const nomFichier  = `Rapport_Topo_GSC_${nomSanitize}.xlsx`

    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="${nomFichier}"`)
      .header('Content-Length', buffer.length)
      .send(buffer)
  })
}