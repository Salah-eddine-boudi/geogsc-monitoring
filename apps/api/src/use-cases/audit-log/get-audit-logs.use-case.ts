/**
 * @file get-audit-logs.use-case.ts
 * @description Use-case : lecture paginée du journal d'audit avec filtres.
 *
 * FILTRES DISPONIBLES :
 * → entiteId  : tous les logs concernant une fiche/mission précise
 * → userId    : toutes les actions d'un utilisateur
 * → action    : filtrer par type d'action (ex: 'VALIDER_FICHE')
 * → dateDebut : logs à partir de cette date
 * → dateFin   : logs jusqu'à cette date
 *
 * EXEMPLE MÉTIER GSC :
 * "Montrez-moi tout ce qui s'est passé sur la fiche du 09/06/2026"
 * → getAuditLogsUseCase({ entiteId: 'cmx...' })
 *
 * "Quelles actions a effectuées l'IGT ce mois ?"
 * → getAuditLogsUseCase({ userId: 'cmx...', dateDebut: '2026-06-01' })
 */

import { prisma } from '../../infrastructure/prisma/prisma.js'
import type { Role } from '../../domain/types.js'

// ─── PARAMÈTRES ───────────────────────────────────────────────────

export interface GetAuditLogsParams {
  userRole: Role       // RBAC — seuls IGT et ADMIN peuvent lire les logs
  page?:      number   // pagination — défaut 1
  limit?:     number   // résultats par page — défaut 20, max 100
  entiteId?:  string   // filtre par entité (fiche, mission...)
  userId?:    string   // filtre par utilisateur
  action?:    string   // filtre par type d'action
  dateDebut?: string   // format ISO "2026-06-01"
  dateFin?:   string   // format ISO "2026-06-30"
}

// ─── TYPE DE RETOUR ───────────────────────────────────────────────

export interface AuditLogEntry {
  id:        string
  action:    string
  entite:    string
  entiteId:  string
  userId:    string
  meta:      unknown
  createdAt: string
  user: {
    id:     string
    nom:    string
    prenom: string
    role:   string
  }
}

export interface GetAuditLogsResult {
  data:       AuditLogEntry[]
  pagination: {
    total:      number
    page:       number
    limit:      number
    totalPages: number
  }
}

// ─── USE-CASE ─────────────────────────────────────────────────────

export async function getAuditLogsUseCase(
  params: GetAuditLogsParams
): Promise<GetAuditLogsResult> {

  // ── RBAC ─────────────────────────────────────────────────────
  // Les logs contiennent des infos sensibles (qui a fait quoi)
  // → réservé IGT et ADMIN uniquement
  if (params.userRole === 'BRIGADE') {
    throw Object.assign(
      new Error('Accès au journal d\'audit réservé IGT/ADMIN'),
      { statusCode: 403 }
    )
  }

  // ── PAGINATION ───────────────────────────────────────────────
  const page  = Math.max(1, params.page  ?? 1)
  const limit = Math.min(100, Math.max(1, params.limit ?? 20))
  const skip  = (page - 1) * limit

  // ── WHERE DYNAMIQUE ──────────────────────────────────────────
  /**
   * On construit l'objet where de façon conditionnelle.
   * Chaque filtre n'est ajouté que s'il est fourni.
   *
   * Prisma accepte les propriétés undefined → les ignore dans la requête SQL.
   * Donc `entiteId: undefined` = pas de filtre sur entiteId.
   */
  const where: Record<string, unknown> = {}

  if (params.entiteId)  where.entiteId = params.entiteId
  if (params.userId)    where.userId   = params.userId
  if (params.action)    where.action   = params.action

  // Filtre par plage de dates
  // createdAt: { gte: dateDebut, lte: dateFin }
  if (params.dateDebut || params.dateFin) {
    const dateFilter: Record<string, Date> = {}
    if (params.dateDebut) dateFilter.gte = new Date(params.dateDebut)
    if (params.dateFin)   dateFilter.lte = new Date(params.dateFin + 'T23:59:59')
    where.createdAt = dateFilter
  }

  // ── REQUÊTES PARALLÈLES ──────────────────────────────────────
  /**
   * Promise.all → count et findMany s'exécutent en parallèle.
   * Plus rapide qu'attendre le count puis le findMany.
   * Sur une grande table de logs, le gain est significatif.
   */
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },  // plus récents en premier
      select: {
        id:        true,
        action:    true,
        entite:    true,
        entiteId:  true,
        userId:    true,
        meta:      true,
        createdAt: true,
        // Jointure avec User pour afficher nom/prénom
        user: {
          select: {
            id:     true,
            nom:    true,
            prenom: true,
            role:   true
          }
        }
      }
    })
  ])

  // ── FORMATAGE ────────────────────────────────────────────────
  const data: AuditLogEntry[] = logs.map(log => ({
    id:        log.id,
    action:    log.action,
    entite:    log.entite,
    entiteId:  log.entiteId,
    userId:    log.userId,
    meta:      log.meta,
    createdAt: log.createdAt.toISOString(),
    user: {
      id:     log.user.id,
      nom:    log.user.nom,
      prenom: log.user.prenom,
      role:   String(log.user.role)
    }
  }))

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}