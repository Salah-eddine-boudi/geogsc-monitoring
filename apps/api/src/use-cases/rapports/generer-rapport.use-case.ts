/**
 * @file generer-rapport.use-case.ts
 * @description Use-case : générer un rapport mensuel pour une brigade.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SCÉNARIO CONCRET :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Fin mai 2026 — M. CHAACHOUI génère le rapport mensuel
 * de la Brigade Équipe 01 (M. AIT KADIR) :
 *
 * → Période : 2026-05
 * → Filtre toutes les fiches VALIDEES du 01/05 au 31/05
 * → Calcule les statistiques automatiquement
 * → Retourne le rapport avec taux de conformité
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * RÈGLES MÉTIER :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Seuls IGT et ADMIN peuvent générer des rapports
 * 2. Brigade peut voir seulement SON rapport
 * 3. Période format "YYYY-MM" obligatoire
 * 4. Seules les fiches VALIDEES sont comptabilisées
 */

import { prisma } from '../../infrastructure/prisma/prisma.js'
import { calculerStatsRapport } from '../../domain/services/rapport.service.js'
import { NotFoundError, AppError } from '../../domain/errors.js'
import type { RapportStats } from '../../domain/entities/rapport.entity.js'

export type GenererRapportInput = {
  brigadeId: string
  periode: string        // format "YYYY-MM" ex: "2026-05"
  userRole: string
  userId: string
  userBrigadeId: string | undefined
}

/**
 * Use-case GenererRapport.
 * Calcule les statistiques en temps réel depuis la BDD.
 * Pas de stockage — rapport généré à la demande.
 *
 * @param input - brigadeId + période + infos utilisateur
 */
export async function genererRapportUseCase(
  input: GenererRapportInput
): Promise<RapportStats> {

  // ── ÉTAPE 1 — Valide le format et la valeur de période ───────────────────────
  const periodeRegex = /^\d{4}-(0[1-9]|1[0-2])$/
  // ↑ mois valides : 01 à 09 et 10, 11, 12
  if (!periodeRegex.test(input.periode)) {
    throw new AppError(
      'PERIODE_INVALIDE',
      'La période doit être au format YYYY-MM avec un mois valide (01-12). Ex: 2026-05',
      400
    )
  }

  // ── ÉTAPE 2 — Contrôle d'accès ───────────────────────────────────────────────
  // Brigade → peut voir seulement son propre rapport
  if (
    input.userRole === 'BRIGADE' &&
    input.userBrigadeId !== input.brigadeId
  ) {
    throw new AppError(
      'FORBIDDEN',
      'Accès interdit — vous ne pouvez consulter que votre propre rapport',
      403
    )
  }

  // ── ÉTAPE 3 — Vérifie que la brigade existe ──────────────────────────────────
  const brigade = await prisma.brigade.findUnique({
    where: { id: input.brigadeId }
  })
  if (!brigade) throw new NotFoundError('Brigade')

  // ── ÉTAPE 4 — Calcule la plage de dates ─────────────────────────────────────
  // "2026-05" → du 01/05/2026 au 31/05/2026
  const [annee, mois] = input.periode.split('-').map(Number)
  const dateDebut = new Date(annee, mois - 1, 1)
  // new Date(2026, 4, 1) → 1er mai 2026 (mois 0-indexé)
  const dateFin = new Date(annee, mois, 0, 23, 59, 59)
  // new Date(2026, 5, 0) → dernier jour de mai 2026

  // ── ÉTAPE 5 — Récupère les fiches VALIDEES de la période ────────────────────
  const fiches = await prisma.ficheJournaliere.findMany({
    where: {
      brigadeId: input.brigadeId,
      statut: 'VALIDEE',
      date: {
        gte: dateDebut,
        lte: dateFin
      }
    },
    include: {
      missions: {
        include: {
          ouvrage: {
            select: {
              id: true,
              reference: true,
              designation: true
            }
          },
          controles: {
            select: { statut: true }
          }
        }
      }
    }
  })

  // ── ÉTAPE 6 — Calcule les statistiques ──────────────────────────────────────
  return calculerStatsRapport(
    fiches,
    input.brigadeId,
    input.periode,
    { id: brigade.id, nom: brigade.nom, chef: brigade.chef }
  )
}