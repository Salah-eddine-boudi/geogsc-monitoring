/**
 * @file export.routes.ts
 * @description Routes d'export — Excel hebdomadaire par brigade.
 *
 * ENDPOINTS :
 * GET /export/excel/:brigadeId/:annee/:semaine
 * → Télécharge le fichier Excel de la semaine ISO
 *
 * EXEMPLE :
 * GET /export/excel/brigade-01/2026/23
 * → "Rapport_Topo_GSC_Equipe01_S23_2026.xlsx"
 */

import type { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../plugins/auth.plugin.js'
import { exporterRapportExcelUseCase, getDatesFromSemaine } from '../../use-cases/export/exporter-rapport-excel.use-case.js'
import { AppError } from '../../domain/errors.js'
import type { JwtPayload } from '../../domain/types.js'

export const exportRoutes: FastifyPluginAsync = async (app) => {

  /**
   * GET /export/excel/:brigadeId/:annee/:semaine
   *
   * Paramètres :
   * - brigadeId : ID de la brigade
   * - annee     : ex: 2026
   * - semaine   : numéro de semaine ISO 1-53
   */
  app.get('/excel/:brigadeId/:annee/:semaine', {
    preHandler: requireAuth
  }, async (request, reply) => {

    const payload = request.user as JwtPayload
    const { brigadeId, annee: anneeStr, semaine: semaineStr } = request.params as {
      brigadeId: string
      annee:     string
      semaine:   string
    }

    const annee   = parseInt(anneeStr, 10)
    const semaine = parseInt(semaineStr, 10)

    // Validation annee
    if (isNaN(annee) || annee < 2020 || annee > 2100) {
      throw new AppError('ANNEE_INVALIDE', 'Année invalide (ex: 2026)', 400)
    }

    // Validation semaine ISO (1-53)
    if (isNaN(semaine) || semaine < 1 || semaine > 53) {
      throw new AppError('SEMAINE_INVALIDE', 'Numéro de semaine invalide (1-53)', 400)
    }

    // RBAC : Brigade → seulement ses propres données
    if (payload.role === 'BRIGADE' && payload.brigadeId !== brigadeId) {
      throw new AppError('FORBIDDEN', 'Accès interdit', 403)
    }

    // Génère le fichier Excel
    const buffer = await exporterRapportExcelUseCase(brigadeId, annee, semaine)

    // Nom du fichier : "Rapport_Topo_GSC_S23_2026.xlsx"
    const nomFichier = `Rapport_Topo_GSC_S${semaine}_${annee}.xlsx`

    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="${nomFichier}"`)
      .header('Content-Length', buffer.length)
      .send(buffer)
  })

  /**
   * GET /export/semaines/:brigadeId/:annee
   * Retourne la liste des semaines disponibles (avec fiches VALIDÉES)
   * pour alimenter le sélecteur frontend.
   */
  app.get('/semaines/:brigadeId/:annee', {
    preHandler: requireAuth
  }, async (request, reply) => {

    const payload = request.user as JwtPayload
    const { brigadeId, annee: anneeStr } = request.params as {
      brigadeId: string
      annee: string
    }

    const annee = parseInt(anneeStr, 10)
    if (isNaN(annee)) throw new AppError('ANNEE_INVALIDE', 'Année invalide', 400)

    if (payload.role === 'BRIGADE' && payload.brigadeId !== brigadeId) {
      throw new AppError('FORBIDDEN', 'Accès interdit', 403)
    }

    // Récupère toutes les fiches VALIDÉES de l'année
    const dateDebut = new Date(annee, 0, 1)
    const dateFin   = new Date(annee, 11, 31, 23, 59, 59)

    const fiches = await import('../../infrastructure/prisma/prisma.js').then(m =>
      m.prisma.ficheJournaliere.findMany({
        where: { brigadeId, statut: 'VALIDEE', date: { gte: dateDebut, lte: dateFin } },
        select: { date: true },
        orderBy: { date: 'asc' }
      })
    )

    // Calcule les numéros de semaine ISO pour chaque fiche
    const semainesSet = new Set<number>()
    for (const fiche of fiches) {
      const d = new Date(fiche.date)
      // Numéro de semaine ISO
      const jan4 = new Date(d.getFullYear(), 0, 4)
      const jourSemaine = jan4.getDay() || 7
      const lundi1 = new Date(jan4)
      lundi1.setDate(jan4.getDate() - jourSemaine + 1)
      const diffMs = d.getTime() - lundi1.getTime()
      const semaine = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
      semainesSet.add(semaine)
    }

    const semaines = Array.from(semainesSet).sort((a, b) => a - b).map(s => {
      const { debut, fin, label } = getDatesFromSemaine(annee, s)
      return { semaine: s, annee, debut: debut.toISOString(), fin: fin.toISOString(), label }
    })

    return reply.status(200).send({ success: true, data: semaines })
  })
}