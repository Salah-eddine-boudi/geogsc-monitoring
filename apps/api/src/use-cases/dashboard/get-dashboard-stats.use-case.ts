import { prisma } from '../../infrastructure/prisma/prisma.js'
import type { Role } from '../../domain/types.js'

export interface GetDashboardStatsParams {
  userRole: Role
  periode?: string
  brigadeId?: string
}

export interface DashboardStats {
  kpis: { totalFiches: number; fichesValidees: number; fichesSoumises: number; fichesBrouillon: number; totalMissions: number; conformes: number; reserves: number; nonConformes: number; tauxConformite: number }
  evolutionJournaliere: { date: string; missions: number; conformes: number; nonConformes: number; taux: number }[]
  repartitionOuvrage: { type: string; conformes: number; reserves: number; nonConformes: number; total: number }[]
  repartitionNature: { nature: string; total: number }[]
  comparaisonBrigades: { brigadeId: string; brigade: string; missions: number; taux: number; fichesSoumises: number }[]
  ncRecentes: { id: string; ficheId: string; date: string; brigade: string; typeOuvrage: string; nature: string | null; partieOuvrage: string | null }[]
}

type RawMission = {
  id: string
  nature: string | null
  resultat: string | null
  partieOuvrage: string | null
  typeOuvrage: string
  ficheId: string
  ficheDate: Date
  brigadeNom: string
  brigadeId: string
}

export async function getDashboardStatsUseCase(params: GetDashboardStatsParams): Promise<DashboardStats> {
  if (params.userRole === 'BRIGADE') {
    throw Object.assign(new Error('Accès réservé IGT/ADMIN'), { statusCode: 403 })
  }

  const periodeStr = params.periode ?? new Date().toISOString().slice(0, 7)
  const [annee, mois] = periodeStr.split('-').map(Number)
  const debutMois = new Date(annee, mois - 1, 1)
  const finMois   = new Date(annee, mois, 0, 23, 59, 59)
  const brigadeId = params.brigadeId

  // ── KPIs FICHES ──────────────────────────────────────────────
  const fichesByStatut = await prisma.ficheJournaliere.groupBy({
    by: ['statut'],
    where: { date: { gte: debutMois, lte: finMois }, ...(brigadeId ? { brigadeId } : {}) },
    _count: { id: true }
  })
  const fc = fichesByStatut.reduce<Record<string, number>>((acc, r) => { acc[r.statut] = r._count.id; return acc }, {})
  const totalFiches     = Object.values(fc).reduce((s, v) => s + v, 0)
  const fichesValidees  = fc['VALIDEE']   ?? 0
  const fichesSoumises  = fc['SOUMISE']   ?? 0
  const fichesBrouillon = fc['BROUILLON'] ?? 0

  // ── MISSIONS VIA SQL BRUT ─────────────────────────────────────
  // $queryRaw contourne le cache du client Prisma
 const missions: RawMission[] = brigadeId
  ? await prisma.$queryRaw`
      SELECT m.id, m.nature, m.resultat, m."partieOuvrage",
             o.type::text AS "typeOuvrage", m."ficheId",
             f.date AS "ficheDate", b.nom AS "brigadeNom", b.id AS "brigadeId"
      FROM missions m
      JOIN fiches_journalieres f ON f.id = m."ficheId"
      JOIN brigades b ON b.id = f."brigadeId"
      JOIN ouvrages o ON o.id = m."ouvrageId"
      WHERE f.date >= ${debutMois} AND f.date <= ${finMois}
        AND b.id = ${brigadeId}
      ORDER BY f.date DESC`
  : await prisma.$queryRaw`
      SELECT m.id, m.nature, m.resultat, m."partieOuvrage",
             o.type::text AS "typeOuvrage", m."ficheId",
             f.date AS "ficheDate", b.nom AS "brigadeNom", b.id AS "brigadeId"
      FROM missions m
      JOIN fiches_journalieres f ON f.id = m."ficheId"
      JOIN brigades b ON b.id = f."brigadeId"
      JOIN ouvrages o ON o.id = m."ouvrageId"
      WHERE f.date >= ${debutMois} AND f.date <= ${finMois}
      ORDER BY f.date DESC`

  // ── CALCULS ───────────────────────────────────────────────────
  let conformes = 0, reserves = 0, nonConformes = 0
  const parJour    = new Map<string, { missions: number; conformes: number; nonConformes: number }>()
  const ouvrageMap = new Map<string, { conformes: number; reserves: number; nonConformes: number }>()
  const natureMap  = new Map<string, number>()

  for (const m of missions) {
    const r = m.resultat
    if (r === 'CONFORME')     conformes++
    if (r === 'RESERVE')      reserves++
    if (r === 'NON_CONFORME') nonConformes++

    const dateStr = new Date(m.ficheDate).toISOString().slice(0, 10)
    const jour = parJour.get(dateStr) ?? { missions: 0, conformes: 0, nonConformes: 0 }
    jour.missions++
    if (r === 'CONFORME')     jour.conformes++
    if (r === 'NON_CONFORME') jour.nonConformes++
    parJour.set(dateStr, jour)

    const type = m.typeOuvrage
    const ouv = ouvrageMap.get(type) ?? { conformes: 0, reserves: 0, nonConformes: 0 }
    if (r === 'CONFORME')     ouv.conformes++
    if (r === 'RESERVE')      ouv.reserves++
    if (r === 'NON_CONFORME') ouv.nonConformes++
    ouvrageMap.set(type, ouv)

    if (m.nature) natureMap.set(m.nature, (natureMap.get(m.nature) ?? 0) + 1)
  }

  const totalMissions  = missions.length
  const tauxConformite = totalMissions > 0 ? Math.round((conformes / totalMissions) * 100) : 0

  const evolutionJournaliere = Array.from(parJour.entries())
    .map(([date, v]) => ({ date, missions: v.missions, conformes: v.conformes, nonConformes: v.nonConformes, taux: v.missions > 0 ? Math.round((v.conformes / v.missions) * 100) : 0 }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const repartitionOuvrage = Array.from(ouvrageMap.entries())
    .map(([type, v]) => ({ type, ...v, total: v.conformes + v.reserves + v.nonConformes }))
    .sort((a, b) => b.total - a.total).slice(0, 8)

  const repartitionNature = Array.from(natureMap.entries())
    .map(([nature, total]) => ({ nature, total }))
    .sort((a, b) => b.total - a.total).slice(0, 10)

  const ncRecentes = missions
    .filter(m => m.resultat === 'NON_CONFORME').slice(0, 10)
    .map(m => ({ id: m.id, ficheId: m.ficheId, date: new Date(m.ficheDate).toISOString().slice(0, 10), brigade: m.brigadeNom, typeOuvrage: m.typeOuvrage, nature: m.nature, partieOuvrage: m.partieOuvrage }))

  // ── COMPARAISON BRIGADES ──────────────────────────────────────
  const brigades = await prisma.brigade.findMany({ where: { actif: true }, select: { id: true, nom: true } })
  const fichesSoumisesMap = new Map(
    (await prisma.ficheJournaliere.groupBy({ by: ['brigadeId'], where: { statut: 'SOUMISE', date: { gte: debutMois, lte: finMois } }, _count: { id: true } }))
    .map(r => [r.brigadeId, r._count.id])
  )

  const comparaisonBrigades = brigades.map(b => {
    const mb    = missions.filter(m => m.brigadeId === b.id)
    const total = mb.length
    const conf  = mb.filter(m => m.resultat === 'CONFORME').length
    return { brigadeId: b.id, brigade: b.nom, missions: total, taux: total > 0 ? Math.round((conf / total) * 100) : 0, fichesSoumises: fichesSoumisesMap.get(b.id) ?? 0 }
  })

  return {
    kpis: { totalFiches, fichesValidees, fichesSoumises, fichesBrouillon, totalMissions, conformes, reserves, nonConformes, tauxConformite },
    evolutionJournaliere, repartitionOuvrage, repartitionNature, comparaisonBrigades, ncRecentes
  }
}