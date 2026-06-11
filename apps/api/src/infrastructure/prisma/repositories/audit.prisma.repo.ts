/**
 * @file audit.prisma.repo.ts
 * @description Repository pour le journal d'audit.
 *
 * PATTERN : Fire-and-forget
 * On n'attend pas la confirmation d'insertion du log.
 * Si le log échoue, l'action principale ne doit pas échouer.
 * C'est la règle d'or des systèmes d'audit.
 */

import { prisma } from '../prisma.js'

import { Prisma } from '@prisma/client'

import { logger } from '../../logger.js'

export type AuditAction =
  | 'AUTH_LOGIN'
  | 'FICHE_CREEE'
  | 'FICHE_SOUMISE'
  | 'FICHE_VALIDEE'
  | 'FICHE_REJETEE'
  | 'MISSION_CREEE'
  | 'MISSION_DEMARREE'
  | 'MISSION_TERMINEE'
  | 'MISSION_SUPPRIMEE'
  | 'CONTROLE_CREE'
  | 'CONTROLE_MODIFIE'
  | 'CONTROLE_SUPPRIME'
  | 'BRIGADE_CREEE'
  | 'BRIGADE_MODIFIEE'

/**
 * Insère un log d'audit en base de données.
 *
 * FIRE-AND-FORGET : on ne bloque pas l'action principale.
 * Si le log échoue → on loggue l'erreur mais on continue.
 *
 * @param action   - Action effectuée
 * @param entite   - Type d'entité concernée
 * @param entiteId - ID de l'entité
 * @param userId   - Utilisateur qui a agi
 * @param meta     - Données supplémentaires (optionnel)
 */
export async function createAuditLog(
  action: AuditAction,
  entite: string,
  entiteId: string,
  userId: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entite,
        entiteId,
        userId,
          meta: (meta ?? {}) as Prisma.InputJsonValue
      }
    })
  } catch (error) {
    // Le log d'audit ne doit jamais faire échouer l'action principale
    logger.warn(
      { err: error, action, entiteId },
      'Audit log insertion failed — non-blocking'
    )
  }
}