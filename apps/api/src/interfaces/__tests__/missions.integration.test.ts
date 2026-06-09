/**
 * @file missions.integration.test.ts
 * @description Tests d'intégration — routes Missions.
 *
 * SCÉNARIO COMPLET TESTÉ :
 * 1. Brigade crée une fiche
 * 2. Brigade ajoute des missions
 * 3. Brigade démarre une mission
 * 4. Brigade termine une mission
 * 5. Brigade soumet la fiche (maintenant possible car missions présentes)
 * 6. IGT valide la fiche
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import helmet from '@fastify/helmet'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { authRoutes } from '../routes/auth.routes.js'
import { fichesRoutes } from '../routes/fiches.routes.js'
import { missionsRoutes } from '../routes/missions.routes.js'
import { errorHandler } from '../error-handler.js'

// ─── SETUP ────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient()

const buildApp = async () => {
  const app = Fastify({ logger: false })
  await app.register(helmet)
  await app.register(cors)
  await app.register(jwt, { secret: 'test-secret' })
  app.setErrorHandler(errorHandler)
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(fichesRoutes, { prefix: '/fiches' })
  await app.register(missionsRoutes, { prefix: '/fiches/:ficheId/missions' })
  return app
}

let app: Awaited<ReturnType<typeof buildApp>>
let tokenBrigade: string
let tokenIGT: string
let ficheId: string
let missionId: string
let ouvrageId: string

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  app = await buildApp()
  const passwordHash = await bcrypt.hash('password123', 10)

  // Crée brigade de test
  const brigade = await prisma.brigade.upsert({
    where: { nom: 'Brigade Mission Test' },
    update: {},
    create: { nom: 'Brigade Mission Test', chef: 'Chef Test' }
  })

  // Crée ouvrage de test
  const ouvrage = await prisma.ouvrage.upsert({
    where: { reference: 'TEST-001' },
    update: {},
    create: {
      reference: 'TEST-001',
      designation: 'Ouvrage de test',
      type: 'PLATINE',
      actif: true
    }
  })
  ouvrageId = ouvrage.id

  // Crée utilisateurs de test
  await prisma.user.upsert({
    where: { email: 'brigade-mission-test@geocoding.ma' },
    update: {},
    create: {
      nom: 'TEST', prenom: 'Brigade',
      email: 'brigade-mission-test@geocoding.ma',
      password: passwordHash,
      role: 'BRIGADE',
      brigadeId: brigade.id
    }
  })

  await prisma.user.upsert({
    where: { email: 'igt-mission-test@geocoding.ma' },
    update: {},
    create: {
      nom: 'TEST', prenom: 'IGT',
      email: 'igt-mission-test@geocoding.ma',
      password: passwordHash,
      role: 'IGT'
    }
  })

  // Login Brigade
  const loginBrigade = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'brigade-mission-test@geocoding.ma', password: 'password123' }
  })
  tokenBrigade = loginBrigade.json().token

  // Login IGT
  const loginIGT = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'igt-mission-test@geocoding.ma', password: 'password123' }
  })
  tokenIGT = loginIGT.json().token

  // Crée fiche de test
  const demain = new Date()
  demain.setDate(demain.getDate() + 2)
  const dateFiche = demain.toISOString().split('T')[0]

  const ficheResponse = await app.inject({
    method: 'POST',
    url: '/fiches',
    headers: { authorization: `Bearer ${tokenBrigade}` },
    payload: { date: dateFiche }
  })
  ficheId = ficheResponse.json().fiche.id
})

afterAll(async () => {
  // Nettoyage
  await prisma.controle.deleteMany()
  await prisma.mission.deleteMany({ where: { ficheId } })
  await prisma.ficheJournaliere.deleteMany({ where: { id: ficheId } })
  await prisma.user.deleteMany({
    where: { email: { in: ['brigade-mission-test@geocoding.ma', 'igt-mission-test@geocoding.ma'] } }
  })
  await prisma.brigade.deleteMany({ where: { nom: 'Brigade Mission Test' } })
  await prisma.ouvrage.deleteMany({ where: { reference: 'TEST-001' } })
  await prisma.$disconnect()
  await app.close()
})

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('POST /fiches/:ficheId/missions', () => {

  describe('✅ Création réussie', () => {

    it('crée une mission en PLANIFIEE', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/fiches/${ficheId}/missions`,
        headers: { authorization: `Bearer ${tokenBrigade}` },
        payload: {
          ouvrageId,
          observations: 'Contrôle platines Axe A'
        }
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.mission.statut).toBe('PLANIFIEE')
      expect(body.mission.heureDebut).toBeNull()
      expect(body.mission.heureFin).toBeNull()

      missionId = body.mission.id
    })

    it('IGT peut voir les missions de la fiche', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/fiches/${ficheId}/missions`,
        headers: { authorization: `Bearer ${tokenIGT}` }
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.missions).toBeInstanceOf(Array)
      expect(body.total).toBeGreaterThan(0)
    })
  })

  describe('❌ Création échouée', () => {

    it('retourne 403 si IGT essaie de créer une mission', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/fiches/${ficheId}/missions`,
        headers: { authorization: `Bearer ${tokenIGT}` },
        payload: { ouvrageId }
      })
      expect(response.statusCode).toBe(403)
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/fiches/${ficheId}/missions`,
        payload: { ouvrageId }
      })
      expect(response.statusCode).toBe(401)
    })

    it('retourne 400 si ouvrageId manquant', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/fiches/${ficheId}/missions`,
        headers: { authorization: `Bearer ${tokenBrigade}` },
        payload: {}
      })
      expect(response.statusCode).toBe(400)
      expect(response.json().code).toBe('VALIDATION_ERROR')
    })
  })
})

describe('GET /fiches/:ficheId/missions', () => {

  it('retourne 200 + liste missions pour Brigade', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/fiches/${ficheId}/missions`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.missions).toBeInstanceOf(Array)
    expect(body.missions[0]).toHaveProperty('ouvrage')
    expect(body.missions[0]).toHaveProperty('controles')
  })

  it('retourne 401 sans token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/fiches/${ficheId}/missions`
    })
    expect(response.statusCode).toBe(401)
  })
})

describe('PATCH /fiches/:ficheId/missions/:id', () => {

  it('démarre une mission — heureDebut → EN_COURS', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/fiches/${ficheId}/missions/${missionId}`,
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
      method: 'PATCH',
      url: `/fiches/${ficheId}/missions/${missionId}`,
      headers: { authorization: `Bearer ${tokenIGT}` },
      payload: { observations: 'Tentative IGT' }
    })
    expect(response.statusCode).toBe(403)
  })
})

describe('POST /fiches/:ficheId/missions/:id/terminer', () => {

  it('termine une mission EN_COURS → TERMINEE', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/missions/${missionId}/terminer`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {}
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.mission.statut).toBe('TERMINEE')
    expect(body.mission.heureFin).toBeDefined()
  })

  it('retourne 400 si mission déjà TERMINEE', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/missions/${missionId}/terminer`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: {}
    })
    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('STATUT_INVALIDE')
  })
})

describe('Scénario complet — soumettre après missions', () => {

  it('peut soumettre la fiche car elle a des missions', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/soumettre`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().fiche.statut).toBe('SOUMISE')
  })

  it('IGT peut valider la fiche soumise', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/valider`,
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().fiche.statut).toBe('VALIDEE')
  })
})

describe('DELETE /fiches/:ficheId/missions/:id', () => {

  it('crée et supprime une mission', async () => {
    // Crée une nouvelle fiche pour ce test
    const lendemain = new Date()
    lendemain.setDate(lendemain.getDate() + 3)

    const nouvelleFiche = await app.inject({
      method: 'POST',
      url: '/fiches',
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: { date: lendemain.toISOString().split('T')[0] }
    })
    const nouvelleFicheId = nouvelleFiche.json().fiche.id

    // Crée une mission
    const nouvelleMission = await app.inject({
      method: 'POST',
      url: `/fiches/${nouvelleFicheId}/missions`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: { ouvrageId }
    })
    const nouvelleMissionId = nouvelleMission.json().mission.id

    // Supprime la mission
    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/fiches/${nouvelleFicheId}/missions/${nouvelleMissionId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(deleteResponse.statusCode).toBe(200)
    expect(deleteResponse.json().success).toBe(true)

    // Nettoyage
    await prisma.ficheJournaliere.delete({ where: { id: nouvelleFicheId } })
  })
})