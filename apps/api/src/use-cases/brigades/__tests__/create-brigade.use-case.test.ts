/**
 * @file create-brigade.use-case.test.ts
 * @description Tests unitaires — création d'une brigade.
 *
 * CE QU'ON TESTE :
 * 1. Création réussie → brigade retournée
 * 2. Nom déjà existant → ConflictError
 * 3. Vérification que findByNom est appelé avant create
 * 4. create n'est pas appelé si le nom existe déjà
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBrigadeUseCase } from '../create-brigade.use-case.js'
import { ConflictError } from '../../../domain/errors.js'
import type { IBrigadeRepository } from '../../../domain/brigade.repository.js'
import type { BrigadeEntity } from '../../../domain/entities/brigade.entity.js'

// ─── DONNÉES DE TEST ──────────────────────────────────────────────────────────

const nouvelleBrigade: BrigadeEntity = {
  id: 'brigade-05',
  nom: 'Équipe 05',
  chef: 'M. BENALI Ahmed',
  actif: true,
  createdAt: new Date()
}

const brigadeExistante: BrigadeEntity = {
  id: 'brigade-01',
  nom: 'Équipe 01',
  chef: 'M. AIT KADIR',
  actif: true,
  createdAt: new Date('2025-12-01')
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

describe('createBrigadeUseCase', () => {

  beforeEach(() => vi.clearAllMocks())

  // ── CAS NOMINAL ──────────────────────────────────────────────────────────────

  describe('✅ Création réussie', () => {

    it('crée et retourne une nouvelle brigade', async () => {
      // ARRANGE
      // findByNom → null (nom disponible)
      vi.mocked(mockBrigadeRepository.findByNom).mockResolvedValue(null)
      // create → retourne la brigade créée
      vi.mocked(mockBrigadeRepository.create).mockResolvedValue(nouvelleBrigade)

      // ACT
      const result = await createBrigadeUseCase(
        { nom: 'Équipe 05', chef: 'M. BENALI Ahmed' },
        mockBrigadeRepository
      )

      // ASSERT
      expect(result.id).toBe('brigade-05')
      expect(result.nom).toBe('Équipe 05')
      expect(result.chef).toBe('M. BENALI Ahmed')
      expect(result.actif).toBe(true)
    })

    it('vérifie le nom AVANT de créer', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findByNom).mockResolvedValue(null)
      vi.mocked(mockBrigadeRepository.create).mockResolvedValue(nouvelleBrigade)

      // ACT
      await createBrigadeUseCase(
        { nom: 'Équipe 05', chef: 'M. BENALI Ahmed' },
        mockBrigadeRepository
      )

      // ASSERT — ordre d'appel correct
      // findByNom doit être appelé AVANT create
      const findByNomOrder = vi.mocked(mockBrigadeRepository.findByNom).mock.invocationCallOrder[0]
      const createOrder = vi.mocked(mockBrigadeRepository.create).mock.invocationCallOrder[0]
      expect(findByNomOrder).toBeLessThan(createOrder)
    })

    it('appelle create avec les bonnes données', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findByNom).mockResolvedValue(null)
      vi.mocked(mockBrigadeRepository.create).mockResolvedValue(nouvelleBrigade)

      // ACT
      await createBrigadeUseCase(
        { nom: 'Équipe 05', chef: 'M. BENALI Ahmed' },
        mockBrigadeRepository
      )

      // ASSERT
      expect(mockBrigadeRepository.create).toHaveBeenCalledWith({
        nom: 'Équipe 05',
        chef: 'M. BENALI Ahmed'
      })
    })
  })

  // ── CAS D'ERREUR ─────────────────────────────────────────────────────────────

  describe('❌ Cas d\'erreur', () => {

    it('lance ConflictError si le nom existe déjà', async () => {
      // ARRANGE
      // Simule : "Équipe 01" existe déjà en BDD
      vi.mocked(mockBrigadeRepository.findByNom).mockResolvedValue(brigadeExistante)

      // ACT & ASSERT
      await expect(
        createBrigadeUseCase(
          { nom: 'Équipe 01', chef: 'M. NOUVEAU' },
          mockBrigadeRepository
        )
      ).rejects.toThrow(ConflictError)
    })

    it('le message d\'erreur mentionne le nom en conflit', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findByNom).mockResolvedValue(brigadeExistante)

      // ACT
      const erreur = await createBrigadeUseCase(
        { nom: 'Équipe 01', chef: 'M. NOUVEAU' },
        mockBrigadeRepository
      ).catch(e => e)

      // ASSERT — le message aide l'admin à comprendre le problème
      expect(erreur.message).toContain('Équipe 01')
    })

    it('ne crée PAS si le nom existe déjà', async () => {
      // ARRANGE
      vi.mocked(mockBrigadeRepository.findByNom).mockResolvedValue(brigadeExistante)

      // ACT
      await createBrigadeUseCase(
        { nom: 'Équipe 01', chef: 'M. NOUVEAU' },
        mockBrigadeRepository
      ).catch(() => {})

      // ASSERT — create ne doit JAMAIS être appelé si conflit
      expect(mockBrigadeRepository.create).not.toHaveBeenCalled()
    })
  })
})