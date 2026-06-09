/**
 * @file terminer-mission.use-case.test.ts
 * @description Tests unitaires — terminaison d'une mission.
 *
 * CE QU'ON TESTE :
 * ✅ Terminaison EN_COURS → TERMINEE
 * ✅ heureFin automatique si non fournie
 * ✅ heureFin fournie utilisée
 * ❌ Mission inexistante → NotFoundError
 * ❌ Mission PLANIFIEE → AppError STATUT_INVALIDE
 * ❌ Mission déjà TERMINEE → AppError STATUT_INVALIDE
 * ❌ heureFin < heureDebut → AppError HEURE_INVALIDE
 * ❌ Fiche non BROUILLON → AppError STATUT_INVALIDE
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { terminerMissionUseCase } from '../terminer-mission.use-case.js'
import { NotFoundError, ForbiddenError, AppError } from '../../../domain/errors.js'
import type { IMissionRepository } from '../../../domain/repositories/mission.repository.js'
import type { IFicheRepository } from '../../../domain/repositories/fiche.repository.js'
import type { MissionWithRelations, MissionEntity } from '../../../domain/entities/mission.entity.js'
import type { FicheWithRelations } from '../../../domain/entities/fiche.entity.js'

// ─── DONNÉES DE TEST ──────────────────────────────────────────────────────────

const ficheBrouillon: FicheWithRelations = {
  id: 'fiche-001',
  date: new Date('2026-06-09'),
  statut: 'BROUILLON',
  observations: null,
  brigadeId: 'brigade-01',
  createurId: 'user-001',
  validateurId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  brigade: { id: 'brigade-01', nom: 'Équipe 01', chef: 'M. AIT KADIR' },
  createur: { id: 'user-001', nom: 'AIT KADIR', prenom: 'Marouane' },
  validateur: null,
  missions: [],
  _count: { missions: 1 }
}

const ficheSoumise: FicheWithRelations = { ...ficheBrouillon, statut: 'SOUMISE' }

const missionEnCours: MissionWithRelations = {
  id: 'mission-001',
  statut: 'EN_COURS',
  heureDebut: new Date('2026-06-09T09:00:00'),
  heureFin: null,
  observations: null,
  ficheId: 'fiche-001',
  ouvrageId: 'ouvrage-001',
  createdAt: new Date(),
  updatedAt: new Date(),
  ouvrage: { id: 'ouvrage-001', reference: 'PLT-A-01', designation: 'Platine A-01', type: 'PLATINE', axe: 'Axe A', niveau: 'R+1' },
  controles: [],
  _count: { controles: 0 }
}

const missionPlanifiee: MissionWithRelations = { ...missionEnCours, statut: 'PLANIFIEE', heureDebut: null }
const missionTerminee: MissionWithRelations = { ...missionEnCours, statut: 'TERMINEE', heureFin: new Date() }

const missionTermineeResult: MissionEntity = {
  id: 'mission-001',
  statut: 'TERMINEE',
  heureDebut: new Date('2026-06-09T09:00:00'),
  heureFin: new Date('2026-06-09T16:00:00'),
  observations: null,
  ficheId: 'fiche-001',
  ouvrageId: 'ouvrage-001',
  createdAt: new Date(),
  updatedAt: new Date()
}

// ─── MOCKS ────────────────────────────────────────────────────────────────────

const mockMissionRepository: IMissionRepository = {
  findByFiche: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
}

const mockFicheRepository: IFicheRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByBrigadeAndDate: vi.fn(),
  create: vi.fn(),
  updateStatut: vi.fn(),
  update: vi.fn()
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('terminerMissionUseCase', () => {

  beforeEach(() => vi.clearAllMocks())

  describe('✅ Terminaison réussie', () => {

    it('termine une mission EN_COURS → TERMINEE', async () => {
      // ARRANGE
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockMissionRepository.update).mockResolvedValue(missionTermineeResult)

      // ACT
      const result = await terminerMissionUseCase(
        { missionId: 'mission-001', userRole: 'BRIGADE', userBrigadeId: 'brigade-01' },
        mockMissionRepository,
        mockFicheRepository
      )

      // ASSERT
      expect(result.statut).toBe('TERMINEE')
      expect(result.heureFin).toBeDefined()
    })

    it('utilise maintenant comme heureFin si non fournie', async () => {
      // ARRANGE
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockMissionRepository.update).mockResolvedValue(missionTermineeResult)

      const avant = new Date()

      // ACT
      await terminerMissionUseCase(
        { missionId: 'mission-001', userRole: 'BRIGADE', userBrigadeId: 'brigade-01' },
        mockMissionRepository,
        mockFicheRepository
      )

      const apres = new Date()

      // ASSERT — heureFin générée automatiquement entre avant et après
      const heureFinPassee = vi.mocked(mockMissionRepository.update).mock.calls[0][1].heureFin as Date
      expect(heureFinPassee.getTime()).toBeGreaterThanOrEqual(avant.getTime())
      expect(heureFinPassee.getTime()).toBeLessThanOrEqual(apres.getTime())
    })

    it('utilise heureFin fournie si présente', async () => {
      // ARRANGE
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)
      vi.mocked(mockMissionRepository.update).mockResolvedValue(missionTermineeResult)

      const heureFinFournie = new Date('2026-06-09T16:00:00')

      // ACT
      await terminerMissionUseCase(
        { missionId: 'mission-001', userRole: 'BRIGADE', userBrigadeId: 'brigade-01', heureFin: heureFinFournie },
        mockMissionRepository,
        mockFicheRepository
      )

      // ASSERT
      expect(mockMissionRepository.update).toHaveBeenCalledWith(
        'mission-001',
        expect.objectContaining({ heureFin: heureFinFournie })
      )
    })
  })

  describe('❌ Cas d\'erreur', () => {

    it('lance NotFoundError si la mission n\'existe pas', async () => {
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(null)

      await expect(
        terminerMissionUseCase(
          { missionId: 'mission-inexistante', userRole: 'BRIGADE', userBrigadeId: 'brigade-01' },
          mockMissionRepository, mockFicheRepository
        )
      ).rejects.toThrow(NotFoundError)
    })

    it('lance AppError STATUT_INVALIDE si mission PLANIFIEE', async () => {
      // SCÉNARIO : brigade essaie de terminer sans avoir démarré
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionPlanifiee)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)

      const erreur = await terminerMissionUseCase(
        { missionId: 'mission-001', userRole: 'BRIGADE', userBrigadeId: 'brigade-01' },
        mockMissionRepository, mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('STATUT_INVALIDE')
    })

    it('lance AppError STATUT_INVALIDE si mission déjà TERMINEE', async () => {
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionTerminee)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)

      const erreur = await terminerMissionUseCase(
        { missionId: 'mission-001', userRole: 'BRIGADE', userBrigadeId: 'brigade-01' },
        mockMissionRepository, mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('STATUT_INVALIDE')
    })

    it('lance AppError HEURE_INVALIDE si heureFin < heureDebut', async () => {
      // SCÉNARIO : heureFin avant heureDebut — impossible
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      // missionEnCours.heureDebut = 09h00
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)

      const erreur = await terminerMissionUseCase(
        {
          missionId: 'mission-001',
          userRole: 'BRIGADE',
          userBrigadeId: 'brigade-01',
          heureFin: new Date('2026-06-09T08:00:00') // 08h00 < 09h00
        },
        mockMissionRepository, mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('HEURE_INVALIDE')
    })

    it('lance AppError STATUT_INVALIDE si fiche SOUMISE', async () => {
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheSoumise)

      const erreur = await terminerMissionUseCase(
        { missionId: 'mission-001', userRole: 'BRIGADE', userBrigadeId: 'brigade-01' },
        mockMissionRepository, mockFicheRepository
      ).catch(e => e)

      expect(erreur).toBeInstanceOf(AppError)
      expect(erreur.code).toBe('STATUT_INVALIDE')
    })

    it('lance ForbiddenError si mission d\'une autre brigade', async () => {
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionEnCours)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)

      await expect(
        terminerMissionUseCase(
          { missionId: 'mission-001', userRole: 'BRIGADE', userBrigadeId: 'brigade-02' },
          mockMissionRepository, mockFicheRepository
        )
      ).rejects.toThrow(ForbiddenError)
    })

    it('ne met pas à jour si erreur', async () => {
      vi.mocked(mockMissionRepository.findById).mockResolvedValue(missionPlanifiee)
      vi.mocked(mockFicheRepository.findById).mockResolvedValue(ficheBrouillon)

      await terminerMissionUseCase(
        { missionId: 'mission-001', userRole: 'BRIGADE', userBrigadeId: 'brigade-01' },
        mockMissionRepository, mockFicheRepository
      ).catch(() => {})

      expect(mockMissionRepository.update).not.toHaveBeenCalled()
    })
  })
})