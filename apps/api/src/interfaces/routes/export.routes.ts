/**
 * @file export.routes.ts
 * @description Routes d'export — Excel récap mensuel.
 *
 * ENDPOINT :
 * GET /export/excel/:brigadeId/:periode
 * → Télécharge le fichier Excel récap mensuel
 * → Format identique aux fichiers Excel GEOCODING actuels
 */

import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../plugins/auth.plugin.js'
import { exporterRapportExcelUseCase } from '../../use-cases/export/exporter-rapport-excel.use-case.js'
import { AppError } from '../../domain/errors.js'
import type { JwtPayload } from '../../domain/types.js'

export const exportRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /export/excel/:brigadeId/:periode
   * Génère et télécharge le fichier Excel récap mensuel.
   *
   * EXEMPLE : GET /export/excel/brigade-01/2026-05
   * → Télécharge "Rapport_Topographique_Equipe01_Mai2026.xlsx"
   */
  app.get('/excel/:brigadeId/:periode', {
    preHandler: requireAuth
  }, async (request, reply) => {
    const payload = request.user as JwtPayload
    const { brigadeId, periode } = request.params as {
      brigadeId: string
      periode: string
    }

    // Validation période
    const periodeRegex = /^\d{4}-(0[1-9]|1[0-2])$/
    if (!periodeRegex.test(periode)) {
      throw new AppError(
        'PERIODE_INVALIDE',
        'La période doit être au format YYYY-MM (ex: 2026-05)',
        400
      )
    }

    // Brigade ne peut exporter que ses propres données
    // IGT/ADMIN peut exporter n'importe quelle brigade
    if (
      payload.role === 'BRIGADE' &&
      payload.brigadeId !== brigadeId
    ) {
      throw new AppError('FORBIDDEN', 'Accès interdit', 403)
    }

    // Génère le fichier Excel
    const buffer = await exporterRapportExcelUseCase(brigadeId, periode)

    // Nom du fichier : "Rapport_Topo_GSC_2026-05.xlsx"
    const nomFichier = `Rapport_Topo_GSC_${periode}.xlsx`

    // Headers HTTP pour le téléchargement
    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="${nomFichier}"`)
      .header('Content-Length', buffer.length)
      .send(buffer)
  })
}