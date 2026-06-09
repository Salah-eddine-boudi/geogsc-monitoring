/**
 * @file create-fiche.use-case.ts
 * @description Use-case : créer une nouvelle fiche journalière.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CONTEXTE MÉTIER :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Chaque matin, le chef de brigade ouvre l'app et crée
 * la fiche du jour pour sa brigade.
 * Cette fiche est le "conteneur" de toutes les missions
 * topographiques effectuées dans la journée.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * RÈGLES MÉTIER :
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. Une brigade ne peut créer qu'UNE seule fiche par jour
 *    → ConflictError si une fiche existe déjà pour ce jour
 *
 * 2. Seule une BRIGADE peut créer une fiche
 *    → vérification du rôle dans la route (requireRole)
 *
 * 3. La fiche est créée pour LA brigade de l'utilisateur
 *    → pas possible de créer une fiche pour une autre brigade
 *
 * 4. La date est normalisée à minuit
 *    → évite les doublons dus aux heures différentes
 */

import type { IFicheRepository } from '../../domain/repositories/fiche.repository.js'
import type { IBrigadeRepository } from '../../domain/brigade.repository.js'
import type { FicheEntity } from '../../domain/entities/fiche.entity.js'
import { ConflictError, NotFoundError, ForbiddenError } from '../../domain/errors.js'

/**
 * Données nécessaires pour créer une fiche.
 *
 * @property date         - Date de la fiche (aujourd'hui en général)
 * @property brigadeId    - Brigade de l'utilisateur connecté
 * @property createurId   - ID de l'utilisateur connecté
 * @property observations - Notes optionnelles sur la journée
 */
export type CreateFicheInput = {
  date: Date
  brigadeId: string
  createurId: string
  observations?: string
}

/**
 * Use-case CreateFiche.
 *
 * ÉTAPES :
 * 1. Vérifie que la brigade existe et est active
 * 2. Vérifie qu'il n'existe pas déjà une fiche pour ce jour
 * 3. Normalise la date à minuit
 * 4. Crée la fiche en statut BROUILLON
 *
 * INJECTION DE DÉPENDANCES :
 * On injecte DEUX repositories car on a besoin de :
 * - IFicheRepository   → créer la fiche
 * - IBrigadeRepository → vérifier que la brigade est active
 *
 * @param input             - données de la nouvelle fiche
 * @param ficheRepository   - contrat repository fiches
 * @param brigadeRepository - contrat repository brigades
 */
export async function createFicheUseCase(
  input: CreateFicheInput,
  ficheRepository: IFicheRepository,
  brigadeRepository: IBrigadeRepository
): Promise<FicheEntity> {

 
  const brigade = await brigadeRepository.findById(input.brigadeId)

  if (!brigade) {
   
    throw new NotFoundError('Brigade')
  }

  if (!brigade.actif) {
    
    throw new ForbiddenError()
  }

  
  const dateNormalisee = new Date(input.date)
  dateNormalisee.setHours(0, 0, 0, 0)
  

  
  const ficheExistante = await ficheRepository.findByBrigadeAndDate(
    input.brigadeId,
    dateNormalisee
  )

  if (ficheExistante) {
    
    throw new ConflictError(
      `Une fiche existe déjà pour la Brigade ${brigade.nom} le ${dateNormalisee.toLocaleDateString('fr-FR')}`
    )
  }

  
  return ficheRepository.create({
    date: dateNormalisee,
    brigadeId: input.brigadeId,
    createurId: input.createurId,
    observations: input.observations
  })
 
}