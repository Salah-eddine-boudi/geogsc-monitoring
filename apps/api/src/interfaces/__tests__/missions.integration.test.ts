/**
 * @file missions.integration.test.ts
 * @description Tests d'intégration — routes Missions (= Réceptions terrain).
 * NB: "mission" dans le code, "réception" à l'affichage.
 *
 * SCÉNARIO COMPLET :
 * 1. Brigade crée une fiche BROUILLON
 * 2. Brigade crée une réception minimale (ouvrageId uniquement)
 * 3. Brigade crée une réception complète (tous les champs CDC v2)
 * 4. Brigade modifie une réception (PATCH partiel)
 * 5. Brigade soumet la fiche (possible car missions présentes)
 * 6. IGT valide la fiche
 *
 * MODIFICATIONS v2 :
 * ✅ Payloads enrichis avec sousZone, provenanceAppareil, periode, ecartMm, observationsNc
 * ✅ Résultat : CONFORME | NON_CONFORME | RESERVE (plus C/NC)
 * ✅ Tests terminer() supprimés — plus dans le flux principal v2
 * ✅ Test PATCH étendu avec les nouveaux champs
 *
 * COMMANDES :
 *   cd apps/api
 *   pnpm vitest run src/interfaces/__tests__/missions.integration.test.ts
 *   pnpm test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import helmet from '@fastify/helmet'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { authRoutes }     from '../routes/auth.routes.js'
import { fichesRoutes }   from '../routes/fiches.routes.js'
import { missionsRoutes } from '../routes/missions.routes.js'
import { errorHandler }   from '../error-handler.js'

// ─── SETUP ────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient()

const buildApp = async () => {
  const app = Fastify({ logger: false })
  await app.register(helmet)
  await app.register(cors)
  await app.register(jwt, { secret: 'test-secret' })
  app.setErrorHandler(errorHandler)
  await app.register(authRoutes,   { prefix: '/auth' })
  await app.register(fichesRoutes, { prefix: '/fiches' })
  await app.register(missionsRoutes, { prefix: '/fiches/:ficheId/missions' })
  return app
}

let app:          Awaited<ReturnType<typeof buildApp>>
let tokenBrigade: string
let tokenIGT:     string
let ficheId:      string
let missionId:    string
let ouvrageId:    string
let userIds:      string[] = []

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  app = await buildApp()
  const passwordHash = await bcrypt.hash('password123', 10)

  const brigade = await prisma.brigade.upsert({
    where:  { nom: 'Brigade Mission Test' },
    update: {},
    create: { nom: 'Brigade Mission Test', chef: 'Chef Test Mission' }
  })

  const ouvrage = await prisma.ouvrage.upsert({
    where:  { reference: 'TEST-MISSION-001' },
    update: {},
    create: {
      reference:   'TEST-MISSION-001',
      designation: 'Crémaillère test intégration',
      type:        'POUTRE_CREMAILLERE_AV_BETONNAGE',
      actif:       true
    }
  })
  ouvrageId = ouvrage.id

  const userBrigade = await prisma.user.upsert({
    where:  { email: 'brigade-mission-test@geocoding.ma' },
    update: {},
    create: {
      nom: 'TEST', prenom: 'Brigade',
      email:    'brigade-mission-test@geocoding.ma',
      password: passwordHash,
      role:     'BRIGADE',
      brigadeId: brigade.id
    }
  })

  const userIGT = await prisma.user.upsert({
    where:  { email: 'igt-mission-test@geocoding.ma' },
    update: {},
    create: {
      nom: 'TEST', prenom: 'IGT',
      email:    'igt-mission-test@geocoding.ma',
      password: passwordHash,
      role:     'IGT'
    }
  })

  userIds = [userBrigade.id, userIGT.id]

  // Login Brigade
  const loginBrigade = await app.inject({
    method: 'POST', url: '/auth/login',
    payload: { email: 'brigade-mission-test@geocoding.ma', password: 'password123' }
  })
  tokenBrigade = loginBrigade.json().token

  // Login IGT
  const loginIGT = await app.inject({
    method: 'POST', url: '/auth/login',
    payload: { email: 'igt-mission-test@geocoding.ma', password: 'password123' }
  })
  tokenIGT = loginIGT.json().token

  // Crée fiche de test (date future pour éviter les conflits)
  const dateFiche = new Date()
  dateFiche.setDate(dateFiche.getDate() + 10)
  const ficheResponse = await app.inject({
    method: 'POST', url: '/fiches',
    headers: { authorization: `Bearer ${tokenBrigade}` },
    payload: { date: dateFiche.toISOString().split('T')[0], conditionMeteo: 'BEAU' }
  })
  ficheId = ficheResponse.json().fiche.id
})

afterAll(async () => {
  await prisma.controle.deleteMany()
  await prisma.mission.deleteMany({ where: { ficheId } })
  await prisma.ficheJournaliere.deleteMany({ where: { id: ficheId } })
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.auditLog.deleteMany({    where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({
    where: { email: { in: ['brigade-mission-test@geocoding.ma', 'igt-mission-test@geocoding.ma'] } }
  })
  await prisma.brigade.deleteMany({ where: { nom: 'Brigade Mission Test' } })
  await prisma.ouvrage.deleteMany({ where: { reference: 'TEST-MISSION-001' } })
  await prisma.$disconnect()
  await app.close()
})

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('POST /fiches/:ficheId/missions', () => {

  describe('Création réussie', () => {

    it('crée une réception minimale — ouvrageId seul', async () => {
      const response = await app.inject({
        method:  'POST',
        url:     `/fiches/${ficheId}/missions`,
        headers: { authorization: `Bearer ${tokenBrigade}` },
        payload: { ouvrageId }
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.mission.statut).toBe('PLANIFIEE')
      expect(body.mission.ficheId).toBe(ficheId)
      expect(body.mission.ouvrageId).toBe(ouvrageId)
      // Les champs optionnels sont null
      expect(body.mission.sousZone).toBeNull()
      expect(body.mission.periode).toBeNull()
      expect(body.mission.ecartMm).toBeNull()

      missionId = body.mission.id
    })

    it('crée une réception complète avec tous les champs CDC v2', async () => {
      // Nouvelle fiche pour ce test
      const dateFiche2 = new Date()
      dateFiche2.setDate(dateFiche2.getDate() + 15)
      const fiche2 = await app.inject({
        method: 'POST', url: '/fiches',
        headers: { authorization: `Bearer ${tokenBrigade}` },
        payload: { date: dateFiche2.toISOString().split('T')[0], conditionMeteo: 'NUAGEUX' }
      })
      const ficheId2 = fiche2.json().fiche.id

      const response = await app.inject({
        method:  'POST',
        url:     `/fiches/${ficheId2}/missions`,
        headers: { authorization: `Bearer ${tokenBrigade}` },
        payload: {
          ouvrageId,
          // §2 Localisation
          zone:          'A',
          sousZone:      'Tribune inférieure',
          axe:           'A14',
          fil:           'H-J',
          niveau:        'RDC',
          partieOuvrage: 'Crémaillère inf. Axe A14/A16',
          // §3 Intervention
          nature:             'RECEPTION_AVANT_BETONNAGE',
          stadeCollage:       'PREMIER_COLLAGE',
          provenanceAppareil: 'GEOCODING',
          nomAppareil:        'Station Leica TS16 N°2',
          periode:            'JOUR',
          ecartMm:            8,
          travailRealise:     'Réception crémaillère avant bétonnage axe A14',
          // §4 Résultat
          resultat:      'CONFORME',
          // §5 Excel + observations
          typeOuvrage:   'POUTRE_CREMAILLERE_AV_BETONNAGE',
          ficheReference: 'F-TOPO-042',
          observations:  'RAS'
        }
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.mission.zone).toBe('A')
      expect(body.mission.sousZone).toBe('Tribune inférieure')
      expect(body.mission.axe).toBe('A14')
      expect(body.mission.fil).toBe('H-J')
      expect(body.mission.nature).toBe('RECEPTION_AVANT_BETONNAGE')
      expect(body.mission.provenanceAppareil).toBe('GEOCODING')
      expect(body.mission.nomAppareil).toBe('Station Leica TS16 N°2')
      expect(body.mission.periode).toBe('JOUR')
      expect(body.mission.ecartMm).toBe(8)
      expect(body.mission.resultat).toBe('CONFORME')
      expect(body.mission.ficheReference).toBe('F-TOPO-042')

      // Nettoyage
      await prisma.mission.deleteMany({ where: { ficheId: ficheId2 } })
      await prisma.ficheJournaliere.delete({ where: { id: ficheId2 } })
    })

    it('crée une réception NC avec observationsNc', async () => {
      const response = await app.inject({
        method:  'POST',
        url:     `/fiches/${ficheId}/missions`,
        headers: { authorization: `Bearer ${tokenBrigade}` },
        payload: {
          ouvrageId,
          zone:           'B',
          nature:         'CONTROLE_COFFRAGE',
          resultat:       'NON_CONFORME',
          observationsNc: 'Dépassement tolérance +15mm sur axe Y',
          ecartMm:        15,
        }
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.mission.resultat).toBe('NON_CONFORME')
      expect(body.mission.observationsNc).toBe('Dépassement tolérance +15mm sur axe Y')
      expect(body.mission.ecartMm).toBe(15)
    })

    it('IGT peut voir les missions de la fiche', async () => {
      const response = await app.inject({
        method:  'GET',
        url:     `/fiches/${ficheId}/missions`,
        headers: { authorization: `Bearer ${tokenIGT}` }
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.missions).toBeInstanceOf(Array)
      expect(body.total).toBeGreaterThan(0)
    })
  })

  describe('Création échouée', () => {

    it('retourne 403 si IGT essaie de créer une mission', async () => {
      const response = await app.inject({
        method:  'POST',
        url:     `/fiches/${ficheId}/missions`,
        headers: { authorization: `Bearer ${tokenIGT}` },
        payload: { ouvrageId }
      })
      expect(response.statusCode).toBe(403)
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method:  'POST',
        url:     `/fiches/${ficheId}/missions`,
        payload: { ouvrageId }
      })
      expect(response.statusCode).toBe(401)
    })

    it('retourne 400 si ouvrageId manquant', async () => {
      const response = await app.inject({
        method:  'POST',
        url:     `/fiches/${ficheId}/missions`,
        headers: { authorization: `Bearer ${tokenBrigade}` },
        payload: {}
      })
      expect(response.statusCode).toBe(400)
      expect(response.json().code).toBe('VALIDATION_ERROR')
    })

    it('retourne 400 si periode invalide (valeur hors enum)', async () => {
      const response = await app.inject({
        method:  'POST',
        url:     `/fiches/${ficheId}/missions`,
        headers: { authorization: `Bearer ${tokenBrigade}` },
        payload: { ouvrageId, periode: 'MATIN' }  // valeur invalide
      })
      expect(response.statusCode).toBe(400)
      expect(response.json().code).toBe('VALIDATION_ERROR')
    })
  })
})

describe('GET /fiches/:ficheId/missions', () => {

  it('retourne 200 + liste missions avec relations ouvrage et controles', async () => {
    const response = await app.inject({
      method:  'GET',
      url:     `/fiches/${ficheId}/missions`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.missions).toBeInstanceOf(Array)
    expect(body.missions[0]).toHaveProperty('ouvrage')
    expect(body.missions[0]).toHaveProperty('controles')
    expect(body.missions[0]).toHaveProperty('_count')
  })

  it('retourne 401 sans token', async () => {
    const response = await app.inject({
      method: 'GET',
      url:    `/fiches/${ficheId}/missions`
    })
    expect(response.statusCode).toBe(401)
  })
})

describe('PATCH /fiches/:ficheId/missions/:id', () => {

  it('modifie les champs de localisation', async () => {
    const response = await app.inject({
      method:  'PATCH',
      url:     `/fiches/${ficheId}/missions/${missionId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {
        axe:      'A16',
        fil:      'J-K',
        sousZone: 'Tribune sup.',
      }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.mission.axe).toBe('A16')
    expect(body.mission.fil).toBe('J-K')
    expect(body.mission.sousZone).toBe('Tribune sup.')
  })

  it('ajoute le résultat CONFORME après mesure', async () => {
    const response = await app.inject({
      method:  'PATCH',
      url:     `/fiches/${ficheId}/missions/${missionId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {
        resultat: 'CONFORME',
        ecartMm:  3,
        periode:  'JOUR',
      }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.mission.resultat).toBe('CONFORME')
    expect(body.mission.ecartMm).toBe(3)
    expect(body.mission.periode).toBe('JOUR')
  })

  it('démarre la mission — heureDebut → statut EN_COURS', async () => {
    const response = await app.inject({
      method:  'PATCH',
      url:     `/fiches/${ficheId}/missions/${missionId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: { heureDebut: new Date().toISOString() }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.mission.statut).toBe('EN_COURS')
    expect(body.mission.heureDebut).toBeDefined()
  })

  it('retourne 403 si IGT essaie de modifier', async () => {
    const response = await app.inject({
      method:  'PATCH',
      url:     `/fiches/${ficheId}/missions/${missionId}`,
      headers: { authorization: `Bearer ${tokenIGT}` },
      payload: { observations: 'Tentative IGT' }
    })
    expect(response.statusCode).toBe(403)
  })
})

describe('Scénario complet — soumettre et valider', () => {

  it('soumet la fiche car elle a des missions', async () => {
    const response = await app.inject({
      method:  'POST',
      url:     `/fiches/${ficheId}/soumettre`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().fiche.statut).toBe('SOUMISE')
  })

  it('IGT valide la fiche soumise', async () => {
    const response = await app.inject({
      method:  'POST',
      url:     `/fiches/${ficheId}/valider`,
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().fiche.statut).toBe('VALIDEE')
  })
})

describe('DELETE /fiches/:ficheId/missions/:id', () => {

  it('crée et supprime une mission dans une fiche indépendante', async () => {
    const dateFuture = new Date('2031-12-31')
    const nouvelleFiche = await app.inject({
      method: 'POST', url: '/fiches',
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: { date: dateFuture.toISOString().split('T')[0] }
    })
    const nouvelleFicheId = nouvelleFiche.json().fiche.id

    const nouvelleMission = await app.inject({
      method:  'POST',
      url:     `/fiches/${nouvelleFicheId}/missions`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: { ouvrageId }
    })
    const nouvelleMissionId = nouvelleMission.json().mission.id

    const deleteResponse = await app.inject({
      method:  'DELETE',
      url:     `/fiches/${nouvelleFicheId}/missions/${nouvelleMissionId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(deleteResponse.statusCode).toBe(200)
    expect(deleteResponse.json().success).toBe(true)

    // Nettoyage
    await prisma.ficheJournaliere.delete({ where: { id: nouvelleFicheId } })
  })
})