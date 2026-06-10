/**
 * @file calcul-statut.service.test.ts
 * @description Tests unitaires — calcul automatique du statut d'un contrôle.
 *
 * C'EST LE TEST LE PLUS IMPORTANT DU PROJET.
 * Le calcul de statut est la règle métier fondamentale :
 * est-ce que l'ouvrage est dans les tolérances ou non ?
 *
 * CE QU'ON TESTE :
 * Tous axes conformes → CONFORME
 * Un axe hors tolérance → NON_CONFORME
 * Axe proche limite (80%) → RESERVE
 * Priorité NON_CONFORME > RESERVE > CONFORME
 * Écarts négatifs (valeur absolue)
 * Aucun axe fourni → CONFORME par défaut
 */

import { describe, it, expect } from 'vitest'
import { calculerStatutControle } from '../../../domain/services/controle.service.js'

describe('calculerStatutControle', () => {

  describe('✅ CONFORME — tous axes dans tolérance', () => {

 it('retourne CONFORME si tous les écarts sont dans la tolérance', () => {
  // SCÉNARIO : platine charpente parfaitement implantée
  // Tolérance ±5mm — écarts mesurés bien en dessous
  expect(calculerStatutControle({
    ecartX: 2,   toleranceX: 5,  // 2mm < 5mm 
    ecartY: -1,  toleranceY: 5,  // 1mm < 5mm 
    ecartZ: 2,   toleranceZ: 3   // 2mm < 3mm 
  })).toBe('CONFORME')
})

    it('retourne CONFORME si écarts nuls', () => {
      // SCÉNARIO : position parfaite — écart = 0
      expect(calculerStatutControle({
        ecartX: 0, toleranceX: 5,
        ecartY: 0, toleranceY: 5,
        ecartZ: 0, toleranceZ: 3
      })).toBe('CONFORME')
    })

    it('retourne CONFORME si aucun axe fourni', () => {
      // SCÉNARIO : contrôle sans mesures numériques
      // Ex: réception visuelle sans mesures
      expect(calculerStatutControle({})).toBe('CONFORME')
    })

    it('retourne CONFORME si axes partiels tous conformes', () => {
      // SCÉNARIO : contrôle altimétrique seul (axe Z uniquement)
      expect(calculerStatutControle({
        ecartZ: 2, toleranceZ: 5
      })).toBe('CONFORME')
    })
  })

  describe('❌ NON_CONFORME — écart hors tolérance', () => {

    it('retourne NON_CONFORME si ecartX dépasse tolérance', () => {
      // SCÉNARIO : platine décalée de 8mm sur X — tolérance 5mm
      expect(calculerStatutControle({
        ecartX: 8,  toleranceX: 5,  // 8mm > 5mm ❌
        ecartY: 2,  toleranceY: 5,
        ecartZ: 1,  toleranceZ: 3
      })).toBe('NON_CONFORME')
    })

    it('retourne NON_CONFORME si ecartZ dépasse tolérance', () => {
      // SCÉNARIO : gradin trop haut de 6mm — tolérance altimétrique 3mm
      expect(calculerStatutControle({
        ecartZ: 6, toleranceZ: 3   // 6mm > 3mm ❌
      })).toBe('NON_CONFORME')
    })

    it('retourne NON_CONFORME même avec écart négatif hors tolérance', () => {
      // SCÉNARIO : poteau décalé de -7mm (valeur absolue = 7mm > 5mm)
      expect(calculerStatutControle({
        ecartX: -7, toleranceX: 5  // |-7| = 7 > 5 ❌
      })).toBe('NON_CONFORME')
    })

    it('retourne NON_CONFORME si un seul axe est hors tolérance', () => {
      // SCÉNARIO : X et Y conformes mais Z hors tolérance
      // Un seul axe non conforme suffit pour invalider tout le contrôle
      expect(calculerStatutControle({
        ecartX: 1,  toleranceX: 5,  // ✅
        ecartY: 2,  toleranceY: 5,  // ✅
        ecartZ: 10, toleranceZ: 3   // ❌ → tout devient NON_CONFORME
      })).toBe('NON_CONFORME')
    })
  })

  describe('⚠️ RESERVE — proche de la limite', () => {

    it('retourne RESERVE si écart > 80% de la tolérance', () => {
      // SCÉNARIO : écart = 4.5mm, tolérance = 5mm
      // 4.5 / 5 = 90% > 80% → RESERVE
      expect(calculerStatutControle({
        ecartX: 4.5, toleranceX: 5  // 4.5 > 5*0.8=4 → RESERVE
      })).toBe('RESERVE')
    })

    it('retourne RESERVE si écart exactement à 80%+1 de la tolérance', () => {
      // Limite exacte du seuil RESERVE
      expect(calculerStatutControle({
        ecartZ: 2.5, toleranceZ: 3  // 2.5 > 3*0.8=2.4 → RESERVE
      })).toBe('RESERVE')
    })
  })

  describe('🏆 Priorité des statuts', () => {

    it('NON_CONFORME prime sur RESERVE', () => {
      // Un axe NON_CONFORME + un axe RESERVE → NON_CONFORME global
      expect(calculerStatutControle({
        ecartX: 10, toleranceX: 5,  // NON_CONFORME
        ecartY: 4,  toleranceY: 5   // RESERVE (4 > 5*0.8=4 → exactement)
      })).toBe('NON_CONFORME')
    })

    it('NON_CONFORME prime sur CONFORME', () => {
      expect(calculerStatutControle({
        ecartX: 10, toleranceX: 5,  // NON_CONFORME
        ecartY: 1,  toleranceY: 5   // CONFORME
      })).toBe('NON_CONFORME')
    })

    it('RESERVE prime sur CONFORME', () => {
      expect(calculerStatutControle({
        ecartX: 4.5, toleranceX: 5, // RESERVE
        ecartY: 1,   toleranceY: 5  // CONFORME
      })).toBe('RESERVE')
    })
  })
})