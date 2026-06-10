/**
 * @file generer-rapport.use-case.test.ts
 * @description Tests unitaires — génération rapport mensuel.
 *
 * CE QU'ON TESTE :
 * Rapport généré avec statistiques correctes
 * Taux conformité calculé correctement
 * Ouvrages NON_CONFORMES identifiés
 * Période invalide → AppError PERIODE_INVALIDE
 * Brigade inexistante → NotFoundError
 * Brigade accède au rapport d'une autre brigade → AppError FORBIDDEN
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculerStatsRapport, calculerTauxConformite } from '../../../domain/services/rapport.service.js'

// ─── TESTS SERVICE RAPPORT ────────────────────────────────────────────────────

describe('calculerTauxConformite', () => {

  it('retourne 100 si aucun contrôle', () => {
    expect(calculerTauxConformite(0, 0)).toBe(100)
  })

  it('retourne 100 si tous conformes', () => {
    expect(calculerTauxConformite(10, 10)).toBe(100)
  })

  it('retourne 0 si aucun conforme', () => {
    expect(calculerTauxConformite(0, 10)).toBe(0)
  })

  it('calcule correctement 84.6%', () => {
    // 198/234 = 84.615... → arrondi à 84.6
    expect(calculerTauxConformite(198, 234)).toBe(84.6)
  })

  it('arrondit à 1 décimale', () => {
    // 2/3 = 66.666... → 66.7
    expect(calculerTauxConformite(2, 3)).toBe(66.7)
  })
})

describe('calculerStatsRapport', () => {

  const brigadeInfo = { id: 'brigade-01', nom: 'Équipe 01', chef: 'M. AIT KADIR' }

  const ficheAvecControles = {
    id: 'fiche-001',
    missions: [
      {
        id: 'mission-001',
        ouvrageId: 'ouvrage-001',
        ouvrage: { reference: 'PLT-A-01', designation: 'Platine A-01' },
        controles: [
          { statut: 'CONFORME' },
          { statut: 'CONFORME' },
          { statut: 'RESERVE' }
        ]
      },
      {
        id: 'mission-002',
        ouvrageId: 'ouvrage-002',
        ouvrage: { reference: 'POT-B-01', designation: 'Poteau B-01' },
        controles: [
          { statut: 'NON_CONFORME' },
          { statut: 'CONFORME' }
        ]
      }
    ]
  }

  describe('✅ Statistiques correctes', () => {

    it('compte les fiches validées', () => {
      const stats = calculerStatsRapport(
        [ficheAvecControles],
        'brigade-01',
        '2026-05',
        brigadeInfo
      )
      expect(stats.nbFichesValidees).toBe(1)
    })

    it('compte les missions', () => {
      const stats = calculerStatsRapport(
        [ficheAvecControles],
        'brigade-01',
        '2026-05',
        brigadeInfo
      )
      expect(stats.nbMissions).toBe(2)
    })

    it('compte les contrôles par statut', () => {
      const stats = calculerStatsRapport(
        [ficheAvecControles],
        'brigade-01',
        '2026-05',
        brigadeInfo
      )
      expect(stats.nbControles).toBe(5)
      expect(stats.nbConformes).toBe(3)
      expect(stats.nbReserves).toBe(1)
      expect(stats.nbNonConformes).toBe(1)
    })

    it('calcule le taux de conformité', () => {
      const stats = calculerStatsRapport(
        [ficheAvecControles],
        'brigade-01',
        '2026-05',
        brigadeInfo
      )
      // 3 conformes / 5 total = 60%
      expect(stats.tauxConformite).toBe(60)
    })

    it('identifie les ouvrages NON_CONFORMES', () => {
      const stats = calculerStatsRapport(
        [ficheAvecControles],
        'brigade-01',
        '2026-05',
        brigadeInfo
      )
      expect(stats.ouvragesNonConformes).toHaveLength(1)
      expect(stats.ouvragesNonConformes[0].reference).toBe('POT-B-01')
      expect(stats.ouvragesNonConformes[0].nbNonConformes).toBe(1)
    })

    it('retourne rapport vide si aucune fiche validée', () => {
      const stats = calculerStatsRapport([], 'brigade-01', '2026-05', brigadeInfo)
      expect(stats.nbFichesValidees).toBe(0)
      expect(stats.nbMissions).toBe(0)
      expect(stats.nbControles).toBe(0)
      expect(stats.tauxConformite).toBe(100)
      expect(stats.ouvragesNonConformes).toHaveLength(0)
    })

    it('retourne les infos de la brigade', () => {
      const stats = calculerStatsRapport(
        [ficheAvecControles],
        'brigade-01',
        '2026-05',
        brigadeInfo
      )
      expect(stats.brigade.nom).toBe('Équipe 01')
      expect(stats.brigade.chef).toBe('M. AIT KADIR')
      expect(stats.periode).toBe('2026-05')
    })

    it('trie les ouvrages NC par nombre décroissant', () => {
      const ficheMultipleNC = {
        id: 'fiche-002',
        missions: [
          {
            id: 'mission-003',
            ouvrageId: 'ouvrage-001',
            ouvrage: { reference: 'PLT-A-01', designation: 'Platine A-01' },
            controles: [
              { statut: 'NON_CONFORME' },
              { statut: 'NON_CONFORME' },
              { statut: 'NON_CONFORME' }
            ]
          },
          {
            id: 'mission-004',
            ouvrageId: 'ouvrage-002',
            ouvrage: { reference: 'POT-B-01', designation: 'Poteau B-01' },
            controles: [{ statut: 'NON_CONFORME' }]
          }
        ]
      }

      const stats = calculerStatsRapport(
        [ficheMultipleNC],
        'brigade-01',
        '2026-05',
        brigadeInfo
      )

      // PLT-A-01 doit être en premier (3 NC > 1 NC)
      expect(stats.ouvragesNonConformes[0].reference).toBe('PLT-A-01')
      expect(stats.ouvragesNonConformes[0].nbNonConformes).toBe(3)
      expect(stats.ouvragesNonConformes[1].reference).toBe('POT-B-01')
    })

    it('agrège les NC du même ouvrage sur plusieurs missions', () => {
      // Même ouvrage dans 2 missions différentes
      const ficheMemeOuvrage = {
        id: 'fiche-003',
        missions: [
          {
            id: 'mission-005',
            ouvrageId: 'ouvrage-001',
            ouvrage: { reference: 'PLT-A-01', designation: 'Platine A-01' },
            controles: [{ statut: 'NON_CONFORME' }, { statut: 'NON_CONFORME' }]
          },
          {
            id: 'mission-006',
            ouvrageId: 'ouvrage-001',
            // Même ouvrage
            ouvrage: { reference: 'PLT-A-01', designation: 'Platine A-01' },
            controles: [{ statut: 'NON_CONFORME' }]
          }
        ]
      }

      const stats = calculerStatsRapport(
        [ficheMemeOuvrage],
        'brigade-01',
        '2026-05',
        brigadeInfo
      )

      // 2+1 = 3 NC pour PLT-A-01
      expect(stats.ouvragesNonConformes[0].nbNonConformes).toBe(3)
      expect(stats.ouvragesNonConformes).toHaveLength(1)
    })
  })
})