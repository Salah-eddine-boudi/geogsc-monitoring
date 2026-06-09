/**
 * @file create-brigade.use-case.ts
 * @description Use-case : créer une nouvelle brigade.
 *
 * ACCÈS : ADMIN uniquement
 * RÈGLES MÉTIER :
 * 1. Seul ADMIN peut créer une brigade
 *    (vérifié dans la route via requireRole)
 * 2. Le nom doit être unique → pas deux "Équipe 01"
 * 3. Le nom et le chef sont obligatoires
 */

import type { IBrigadeRepository } from '../../domain/brigade.repository.js'
import type { BrigadeEntity } from '../../domain/entities/brigade.entity.js'
import { ConflictError } from '../../domain/errors.js'

/**
 
 * @property nom  - "Équipe 05" — doit être unique en BDD
 * @property chef - "M. BENALI Ahmed" — nom complet du chef
 */
export type CreateBrigadeInput = {
  nom: string
  chef: string
}

/**
 *
 * @param input             - nom et chef de la nouvelle brigade
 * @param brigadeRepository - contrat repository
 */
export async function createBrigadeUseCase(
  input: CreateBrigadeInput,
  brigadeRepository: IBrigadeRepository
): Promise<BrigadeEntity> {

  // ÉTAPE 1 — vérifie l'unicité du nom
  const existante = await brigadeRepository.findByNom(input.nom)

  if (existante) {
    // Une brigade avec ce nom existe déjà
    // HTTP 409 Conflict — "cette ressource existe déjà"
    throw new ConflictError(`Une brigade avec le nom "${input.nom}" existe déjà`)
  }

  // ÉTAPE 2 — crée la brigade
  // actif: true par défaut (défini dans schema Prisma)
  const brigade = await brigadeRepository.create({
    nom: input.nom,
    chef: input.chef
  })

  // ÉTAPE 3 — retourne la brigade créée
  // Le frontend peut immédiatement l'afficher sans refaire un GET
  return brigade
}