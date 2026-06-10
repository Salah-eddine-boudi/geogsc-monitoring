/**
 * @file fiches.integration.test.ts
 * @description Tests d'intégration — routes Fiches Journalières.
 *
 * SCÉNARIO COMPLET TESTÉ :
 * 1. Brigade crée une fiche
 * 2. Brigade modifie les observations
 * 3. Brigade soumet la fiche (après ajout missions)
 * 4. IGT rejette avec motif
 * 5. Brigade corrige et resoumet
 * 6. IGT valide
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
let ouvrageId: string

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  app = await buildApp()
  const passwordHash = await bcrypt.hash('password123', 10)

  // Brigade de test
  const brigade = await prisma.brigade.upsert({
    where: { nom: 'Brigade Fiche Integration Test' },
    update: {},
    create: { nom: 'Brigade Fiche Integration Test', chef: 'Chef Test' }
  })

  // Ouvrage de test
  const ouvrage = await prisma.ouvrage.upsert({
    where: { reference: 'FICHE-TEST-001' },
    update: {},
    create: {
      reference: 'FICHE-TEST-001',
      designation: 'Ouvrage test fiches',
      type: 'PLATINE',
      actif: true
    }
  })
  ouvrageId = ouvrage.id

  // Utilisateurs de test
  await prisma.user.upsert({
    where: { email: 'brigade-fiche-test@geocoding.ma' },
    update: {},
    create: {
      nom: 'TEST', prenom: 'Brigade',
      email: 'brigade-fiche-test@geocoding.ma',
      password: passwordHash,
      role: 'BRIGADE',
      brigadeId: brigade.id
    }
  })

  await prisma.user.upsert({
    where: { email: 'igt-fiche-test@geocoding.ma' },
    update: {},
    create: {
      nom: 'TEST', prenom: 'IGT',
      email: 'igt-fiche-test@geocoding.ma',
      password: passwordHash,
      role: 'IGT'
    }
  })

  // Login Brigade
  const loginBrigade = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'brigade-fiche-test@geocoding.ma', password: 'password123' }
  })
  tokenBrigade = loginBrigade.json().token

  // Login IGT
  const loginIGT = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'igt-fiche-test@geocoding.ma', password: 'password123' }
  })
  tokenIGT = loginIGT.json().token
})

afterAll(async () => {
  // Nettoyage dans l'ordre strict des dépendances
  // 1. Contrôles → 2. Missions → 3. Fiches → 4. Users → 5. Brigade → 6. Ouvrage

  if (ficheId) {
    // Récupère toutes les missions de la fiche
    const missions = await prisma.mission.findMany({ where: { ficheId } })

    // Supprime les contrôles de chaque mission
    for (const m of missions) {
      await prisma.controle.deleteMany({ where: { missionId: m.id } })
    }

    // Supprime les missions
    await prisma.mission.deleteMany({ where: { ficheId } })

    // Supprime la fiche
    await prisma.ficheJournaliere.deleteMany({ where: { id: ficheId } })
  }

  // Supprime d'abord les fiches restantes créées par ces users
  // (cas où ficheId n'est pas set mais des fiches ont été créées)
  const users = await prisma.user.findMany({
    where: { email: { in: ['brigade-fiche-test@geocoding.ma', 'igt-fiche-test@geocoding.ma'] } }
  })

  for (const user of users) {
    // Supprime toutes les fiches créées par cet user
    const fiches = await prisma.ficheJournaliere.findMany({
      where: { createurId: user.id }
    })
    for (const fiche of fiches) {
      const missions = await prisma.mission.findMany({ where: { ficheId: fiche.id } })
      for (const m of missions) {
        await prisma.controle.deleteMany({ where: { missionId: m.id } })
      }
      await prisma.mission.deleteMany({ where: { ficheId: fiche.id } })
    }
    await prisma.ficheJournaliere.deleteMany({ where: { createurId: user.id } })
  }

  // Maintenant supprime les users
  await prisma.user.deleteMany({
    where: { email: { in: ['brigade-fiche-test@geocoding.ma', 'igt-fiche-test@geocoding.ma'] } }
  })

  // Supprime brigade et ouvrage
  await prisma.brigade.deleteMany({ where: { nom: 'Brigade Fiche Integration Test' } })
  await prisma.ouvrage.deleteMany({ where: { reference: 'FICHE-TEST-001' } })

  await prisma.$disconnect()
  await app.close()
})
// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('POST /fiches', () => {

  describe('✅ Création réussie', () => {

    it('Brigade crée une fiche en BROUILLON', async () => {
      // Date dans le futur pour éviter les conflits
      const date = new Date()
      date.setDate(date.getDate() + 15)

      const response = await app.inject({
        method: 'POST',
        url: '/fiches',
        headers: { authorization: `Bearer ${tokenBrigade}` },
        payload: {
          date: date.toISOString().split('T')[0],
          observations: 'Journée contrôle Tribune Nord'
        }
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.fiche.statut).toBe('BROUILLON')
      expect(body.fiche.validateurId).toBeNull()
      expect(body.fiche.brigadeId).toBeDefined()

      ficheId = body.fiche.id
    })

    it('ne retourne pas le mot de passe du créateur', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/fiches/${ficheId}`,
        headers: { authorization: `Bearer ${tokenBrigade}` }
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.fiche.createur).not.toHaveProperty('password')
    })
  })

  describe('❌ Création échouée', () => {

    it('retourne 409 si fiche existe déjà pour ce jour', async () => {
  // On utilise directement la même date qu'on a envoyée
  // pas celle stockée en BDD (décalage UTC)
  const date = new Date()
  date.setDate(date.getDate() + 15)
  const dateFiche = date.toISOString().split('T')[0]
  // ↑ même date que celle envoyée lors de la création

  const response = await app.inject({
    method: 'POST',
    url: '/fiches',
    headers: { authorization: `Bearer ${tokenBrigade}` },
    payload: { date: dateFiche }
  })

  expect(response.statusCode).toBe(409)
  expect(response.json().code).toBe('CONFLICT')
})

    it('retourne 403 si IGT essaie de créer', async () => {
      const date = new Date()
      date.setDate(date.getDate() + 20)

      const response = await app.inject({
        method: 'POST',
        url: '/fiches',
        headers: { authorization: `Bearer ${tokenIGT}` },
        payload: { date: date.toISOString().split('T')[0] }
      })

      expect(response.statusCode).toBe(403)
    })

    it('retourne 401 sans token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/fiches',
        payload: { date: '2026-12-01' }
      })

      expect(response.statusCode).toBe(401)
    })

    it('retourne 400 si date invalide', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/fiches',
        headers: { authorization: `Bearer ${tokenBrigade}` },
        payload: { date: 'pas-une-date' }
      })

      expect(response.statusCode).toBe(400)
    })
  })
})

describe('GET /fiches', () => {

  it('IGT voit toutes les fiches', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/fiches',
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    const fiches = body.data ?? body.fiches
    expect(fiches).toBeInstanceOf(Array)
    const pagination = body.pagination ?? { total: body.total }
    expect(pagination).toHaveProperty('total')
  })

  it('Brigade voit seulement ses fiches', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/fiches',
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    const fiches = body.data ?? body.fiches ?? []

    const brigadeUser = await prisma.user.findUnique({
      where: { email: 'brigade-fiche-test@geocoding.ma' }
    })

    fiches.forEach((f: any) => {
      expect(f.brigadeId).toBe(brigadeUser!.brigadeId)
    })
  })

  it('filtre par statut BROUILLON', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/fiches?statut=BROUILLON',
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    const fiches = body.data ?? body.fiches ?? []

    fiches.forEach((f: any) => {
      expect(f.statut).toBe('BROUILLON')
    })
  })
})

describe('GET /fiches/:id', () => {

  it('retourne la fiche complète avec relations', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/fiches/${ficheId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.fiche).toHaveProperty('brigade')
    expect(body.fiche).toHaveProperty('createur')
    expect(body.fiche).toHaveProperty('missions')
    expect(body.fiche).toHaveProperty('_count')
  })

  it('retourne 404 si fiche inexistante', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/fiches/id-inexistant',
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(404)
    expect(response.json().code).toBe('NOT_FOUND')
  })
})

describe('PATCH /fiches/:id', () => {

  it('Brigade modifie les observations', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/fiches/${ficheId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: { observations: 'Observations modifiées — pluie après-midi' }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().fiche.observations).toContain('pluie')
    expect(response.json().fiche.statut).toBe('BROUILLON')
  })

  it('retourne 403 si IGT essaie de modifier', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/fiches/${ficheId}`,
      headers: { authorization: `Bearer ${tokenIGT}` },
      payload: { observations: 'Tentative IGT' }
    })

    expect(response.statusCode).toBe(403)
  })
})

describe('Scénario complet — cycle de vie fiche', () => {

  it('1. Brigade soumet une fiche vide → FICHE_VIDE', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/soumettre`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('FICHE_VIDE')
  })

  it('2. Brigade ajoute une mission', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/missions`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: { ouvrageId }
    })

    expect(response.statusCode).toBe(201)
  })

  it('3. Brigade soumet la fiche avec missions → SOUMISE', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/soumettre`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().fiche.statut).toBe('SOUMISE')
  })

  it('4. Brigade ne peut plus modifier une fiche SOUMISE', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: `/fiches/${ficheId}`,
      headers: { authorization: `Bearer ${tokenBrigade}` },
      payload: { observations: 'Tentative après soumission' }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('STATUT_INVALIDE')
  })

  it('5. IGT rejette avec motif → REJETEE', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/rejeter`,
      headers: { authorization: `Bearer ${tokenIGT}` },
      payload: {
        motif: 'Mission 1 — écart Z non documenté. Veuillez ajouter les mesures correctives.'
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().fiche.statut).toBe('REJETEE')
    expect(response.json().fiche.validateurId).toBeDefined()
  })

  it('6. Brigade resoumet après correction → SOUMISE', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/soumettre`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().fiche.statut).toBe('SOUMISE')
  })

  it('7. IGT valide → VALIDEE', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/valider`,
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().fiche.statut).toBe('VALIDEE')
    expect(response.json().fiche.validateurId).toBeDefined()
  })

  it('8. Fiche VALIDEE — immuable', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/fiches/${ficheId}/soumettre`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('STATUT_INVALIDE')
  })
})