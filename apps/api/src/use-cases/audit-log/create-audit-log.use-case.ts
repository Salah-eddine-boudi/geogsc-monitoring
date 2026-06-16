/**
 * @file create-audit-log.use-case.ts
 * @description Use-case : écrire une entrée dans le journal d'audit.
 *
 * PRINCIPE FIRE-AND-FORGET :
 * Ce use-case ne doit jamais bloquer la requête principale.
 * Si l'INSERT échoue (BDD indisponible, timeout...), on log l'erreur
 * avec Pino mais on ne throw pas — l'action principale a déjà réussi.
 *
 * USAGE dans une route :
 * // Après avoir validé une fiche avec succès :
 * createAuditLogUseCase({
 *   action: 'VALIDER_FICHE',
 *   entite: 'FicheJournaliere',
 *   entiteId: fiche.id,
 *   userId: payload.sub,
 *   meta: { ancienStatut: 'SOUMISE', nouveauStatut: 'VALIDEE' }
 * }).catch(err => logger.error(err, 'AuditLog failed'))
 *
 * Le .catch() est OBLIGATOIRE pour éviter une UnhandledPromiseRejection.
 */
import { Prisma } from '@prisma/client'
import { undefined } from 'zod/v4/mini'
import { prisma } from '../../infrastructure/prisma/prisma.js'

// ─── ACTIONS PRÉDÉFINIES ──────────────────────────────────────────
// Constantes pour éviter les fautes de frappe dans les routes.
// Toujours utiliser ces constantes plutôt que des strings littéraux.

export const AUDIT_ACTIONS = {
  // Auth
  LOGIN:               'LOGIN',
  LOGOUT:              'LOGOUT',

  // Fiches journalières
  CREATE_FICHE:        'CREATE_FICHE',
  UPDATE_FICHE:        'UPDATE_FICHE',
  SOUMETTRE_FICHE:     'SOUMETTRE_FICHE',
  VALIDER_FICHE:       'VALIDER_FICHE',
  REJETER_FICHE:       'REJETER_FICHE',

  // Missions
  CREATE_MISSION:      'CREATE_MISSION',
  UPDATE_MISSION:      'UPDATE_MISSION',
  DELETE_MISSION:      'DELETE_MISSION',

  // Comptes Rendus CP
  CREATE_CP:           'CREATE_CP',
  SOUMETTRE_CP:        'SOUMETTRE_CP',

  // Administration
  CREATE_BRIGADE:      'CREATE_BRIGADE',
  UPDATE_BRIGADE:      'UPDATE_BRIGADE',
  CREATE_USER:         'CREATE_USER',
  UPDATE_USER:         'UPDATE_USER',
} as const

// Type dérivé des clés — permet l'autocomplétion TypeScript
export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS]

// ─── PARAMÈTRES ───────────────────────────────────────────────────

export interface CreateAuditLogParams {
  action: AuditAction       // ex: 'VALIDER_FICHE'
  entite: string            // nom du modèle Prisma — ex: 'FicheJournaliere'
  entiteId: string          // ID de l'entité concernée
  userId: string            // ID de l'utilisateur qui a effectué l'action
  meta?: Record<string, unknown>  // données contextuelles libres (JSON)
}

// ─── USE-CASE ─────────────────────────────────────────────────────

/**
 * createAuditLogUseCase — persiste une entrée de log en BDD.
 *
 * TOUJOURS appeler avec .catch() dans les routes :
 * createAuditLogUseCase({...}).catch(err => logger.error(err))
 *
 * JAMAIS avec await seul — ça bloquerait la réponse.
 */
export async function createAuditLogUseCase(
  params: CreateAuditLogParams
): Promise<void> {
  const { action, entite, entiteId, userId, meta } = params

  await prisma.auditLog.create({
    data: {
      action,
      entite,
      entiteId,
      userId,
      // meta est un champ Json? dans Prisma
      // On cast en any pour éviter les conflits de types Json
      meta: (meta ?? Prisma.JsonNull) as Prisma.InputJsonValue
    }
  })
}