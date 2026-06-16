/**
 * @file update-brigade.use-case.test.ts
 * @description Tests unitaires — modification d'une brigade.
 *
 * SCÉNARIOS TESTÉS :
 *
 * ✅ CAS NOMINAL :
 * 1. Changer le chef d'équipe
 *    → Brigade 02 : M. TAKI remplacé par M. RACHIDI
 *
 * 2. Suspendre une brigade
 *    → Équipe 04 suspendue pendant Aid Al-Fitr (actif: false)
 *
 * 3. Réactiver une brigade
 *    → Équipe 04 réactivée après la reprise (actif: true)
 *
 * 4. Changer le nom + chef en même temps
 *
 * ❌ CAS D'ERREUR :
 * 5. Brigade inexistante → NotFoundError
 * 6. Nouveau nom déjà pris → ConflictError
 * 7. Même nom → pas de vérification doublon (inutile)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateBrigadeUseCase } from '../update-brigade.use-case.js'
import { NotFoundError, ConflictError } from '../../../domain/errors.js'
import type { IBrigadeRepository } from '../../../domain/brigade.repository.js'
import type { BrigadeEntity, BrigadeWithMembers } from '../../../domain/entities/brigade.entity.js'

// ─── DONNÉES DE TEST ──────────────────────────────────────────────────────────

/**
 * Brigade 02 existante avant modification.
 */
const brigade02: BrigadeWithMembers = {
  id: 'brigade-02',
  nom: 'Équipe 02',
  chef: 'M. Hamid TAKI',
  actif: true,
  createdAt: new Date('2025-12-01'),
  membres: []
}

/**
 * Brigade 01 existante — pour tester les conflits de nom.
 */
const brigade01: BrigadeEntity = {
  id: 'brigade-01',
  nom: 'Équipe 01',
  chef: 'M. Marouane AIT KADIR',
  actif: true,
  createdAt: new Date('2025-12-01')
}

/**
 * Résultat après changement de chef.
 */
const brigade02ChefModifie: BrigadeEntity = {
  ...brigade02,
  chef: 'M. RACHIDI Karim'
}

/**
 * Résultat après suspension.
 */
const brigade02Suspendue: BrigadeEntity = {
  ...brigade02,
  actif: false
}

// ─── MOCK REPOSITORY ──────────────────────────────────────────────────────────

const mockBrigadeRepository: IBrigadeRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByNom: vi.fn(),
  create: vi.fn(),
  update: vi.fn()
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('updateBrigadeUseCase', () => {

  beforeEach(() => vi.clearAllMocks())

  // ── CAS NOMINAL ──────────────────────────────────────────────────────────────

  describe('✅ Modifications réussies', () => {

    it('change le chef d\'équipe', async () => {
      // SCÉNARIO : M. TAKI quitte le projet → remplacé par M. RACHIDI
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigade02)
      vi.mocked(mockBrigadeRepository.update).mockResolvedValue(brigade02ChefModifie)

      // ACT
      const result = await updateBrigadeUseCase(
        { id: 'brigade-02', chef: 'M. RACHIDI Karim' },
        mockBrigadeRepository
      )

      // ASSERT
      expect(result.chef).toBe('M. RACHIDI Karim')
      expect(result.nom).toBe('Équipe 02') // nom inchangé
      expect(result.actif).toBe(true)      // statut inchangé
    })

    it('suspend une brigade (actif: false)', async () => {
      // SCÉNARIO : Équipe 04 suspendue pendant Aid Al-Fitr
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigade02)
      vi.mocked(mockBrigadeRepository.update).mockResolvedValue(brigade02Suspendue)

      // ACT
      const result = await updateBrigadeUseCase(
        { id: 'brigade-02', actif: false },
        mockBrigadeRepository
      )

      // ASSERT
      expect(result.actif).toBe(false)
      expect(result.nom).toBe('Équipe 02') // nom inchangé
    })

    it('réactive une brigade suspendue (actif: true)', async () => {
      // SCÉNARIO : reprise après Aid Al-Fitr
      // ARRANGE
      const brigadeSuspendue: BrigadeWithMembers = { ...brigade02, actif: false, membres: [] }
      const brigadeReactivee: BrigadeEntity = { ...brigade02, actif: true }

      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigadeSuspendue)
      vi.mocked(mockBrigadeRepository.update).mockResolvedValue(brigadeReactivee)

      // ACT
      const result = await updateBrigadeUseCase(
        { id: 'brigade-02', actif: true },
        mockBrigadeRepository
      )

      // ASSERT
      expect(result.actif).toBe(true)
    })

    it('modifie nom + chef en même temps', async () => {
      // SCÉNARIO : restructuration complète d'une équipe
      // ARRANGE
      const resultat: BrigadeEntity = {
        ...brigade02,
        nom: 'Équipe 05',
        chef: 'M. BENALI Ahmed'
      }

      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigade02)
      vi.mocked(mockBrigadeRepository.findByNom).mockResolvedValue(null) // nom dispo
      vi.mocked(mockBrigadeRepository.update).mockResolvedValue(resultat)

      // ACT
      const result = await updateBrigadeUseCase(
        { id: 'brigade-02', nom: 'Équipe 05', chef: 'M. BENALI Ahmed' },
        mockBrigadeRepository
      )

      // ASSERT
      expect(result.nom).toBe('Équipe 05')
      expect(result.chef).toBe('M. BENALI Ahmed')
    })

    it('ne vérifie pas le nom si on ne le change pas', async () => {
      // SCÉNARIO : on change seulement le chef → pas besoin de vérifier le nom
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigade02)
      vi.mocked(mockBrigadeRepository.update).mockResolvedValue(brigade02ChefModifie)

      // ACT
      await updateBrigadeUseCase(
        { id: 'brigade-02', chef: 'M. RACHIDI Karim' },
        // pas de nom dans l'input
        mockBrigadeRepository
      )

      // ASSERT — findByNom ne doit pas être appelé inutilement
      expect(mockBrigadeRepository.findByNom).not.toHaveBeenCalled()
    })

    it('ne vérifie pas le nom si le nouveau nom est identique à l\'ancien', async () => {
      // SCÉNARIO : ADMIN envoie le même nom → pas besoin de vérifier doublon
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigade02)
      vi.mocked(mockBrigadeRepository.update).mockResolvedValue(brigade02)

      // ACT
      await updateBrigadeUseCase(
        { id: 'brigade-02', nom: 'Équipe 02' }, // même nom
        mockBrigadeRepository
      )

      // ASSERT — pas de vérification inutile
      expect(mockBrigadeRepository.findByNom).not.toHaveBeenCalled()
    })

    it('appelle update avec seulement les champs fournis', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigade02)
      vi.mocked(mockBrigadeRepository.update).mockResolvedValue(brigade02ChefModifie)

      // ACT
      await updateBrigadeUseCase(
        { id: 'brigade-02', chef: 'M. RACHIDI Karim' },
        mockBrigadeRepository
      )

      // ASSERT — update appelé avec seulement { chef }
      // pas { nom: undefined, actif: undefined }
      expect(mockBrigadeRepository.update).toHaveBeenCalledWith(
        'brigade-02',
        { chef: 'M. RACHIDI Karim' }
      )
    })
  })

  // ── CAS D'ERREUR ─────────────────────────────────────────────────────────────

  describe('❌ Cas d\'erreur', () => {

    it('lance NotFoundError si la brigade n\'existe pas', async () => {
      // SCÉNARIO : ADMIN essaie de modifier une brigade supprimée
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(null)

      // ACT & ASSERT
      await expect(
        updateBrigadeUseCase(
          { id: 'brigade-inexistante', chef: 'M. NOUVEAU' },
          mockBrigadeRepository
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('ne fait pas update si la brigade n\'existe pas', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(null)

      // ACT
      await updateBrigadeUseCase(
        { id: 'brigade-inexistante', chef: 'M. NOUVEAU' },
        mockBrigadeRepository
      ).catch(() => {})

      // ASSERT — update ne doit jamais être appelé
      expect(mockBrigadeRepository.update).not.toHaveBeenCalled()
    })

    it('lance ConflictError si le nouveau nom est déjà pris', async () => {
      // SCÉNARIO : ADMIN essaie de renommer Brigade 02 en "Équipe 01"
      // mais "Équipe 01" existe déjà
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigade02)
      vi.mocked(mockBrigadeRepository.findByNom).mockResolvedValue(brigade01)
      // brigade01 existe → conflit

      // ACT & ASSERT
      await expect(
        updateBrigadeUseCase(
          { id: 'brigade-02', nom: 'Équipe 01' },
          mockBrigadeRepository
        )
      ).rejects.toThrow(ConflictError)
    })

    it('ne fait pas update si le nouveau nom est en conflit', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findById).mockResolvedValue(brigade02)
      vi.mocked(mockBrigadeRepository.findByNom).mockResolvedValue(brigade01)

      // ACT
      await updateBrigadeUseCase(
        { id: 'brigade-02', nom: 'Équipe 01' },
        mockBrigadeRepository
      ).catch(() => {})

      // ASSERT
      expect(mockBrigadeRepository.update).not.toHaveBeenCalled()
    })
  })
})