/**
 * @file rapports.integration.test.ts
 * @description Tests d'intégration — routes Rapports.
 *
 * SCÉNARIO :
 * 1. Brigade crée et valide des fiches avec missions et contrôles
 * 2. IGT génère le rapport mensuel
 * 3. Vérification des statistiques
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
import { controlesRoutes } from '../routes/controles.routes.js'
import { rapportsRoutes } from '../routes/rapports.routes.js'
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
  await app.register(controlesRoutes, { prefix: '/fiches/:ficheId/missions/:missionId/controles' })
  await app.register(rapportsRoutes, { prefix: '/rapports' })
  return app
}

let app: Awaited<ReturnType<typeof buildApp>>
let tokenBrigade: string
let tokenIGT: string
let brigadeId: string
let ouvrageId: string
let periode: string

// ─── LIFECYCLE ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  app = await buildApp()
  const passwordHash = await bcrypt.hash('password123', 10)

  // Période de test = mois courant
  const now = new Date()
  periode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Brigade de test
  const brigade = await prisma.brigade.upsert({
    where: { nom: 'Brigade Rapport Test' },
    update: {},
    create: { nom: 'Brigade Rapport Test', chef: 'Chef Test' }
  })
  brigadeId = brigade.id

  // Ouvrage de test
  const ouvrage = await prisma.ouvrage.upsert({
    where: { reference: 'RPT-TEST-001' },
    update: {},
    create: { reference: 'RPT-TEST-001', designation: 'Ouvrage rapport test', type: 'PLATINE', actif: true }
  })
  ouvrageId = ouvrage.id

  // Users de test
  await prisma.user.upsert({
    where: { email: 'brigade-rpt-test@geocoding.ma' },
    update: {},
    create: { nom: 'TEST', prenom: 'Brigade', email: 'brigade-rpt-test@geocoding.ma', password: passwordHash, role: 'BRIGADE', brigadeId: brigade.id }
  })

  await prisma.user.upsert({
    where: { email: 'igt-rpt-test@geocoding.ma' },
    update: {},
    create: { nom: 'TEST', prenom: 'IGT', email: 'igt-rpt-test@geocoding.ma', password: passwordHash, role: 'IGT' }
  })

  // Login
  const loginBrigade = await app.inject({
    method: 'POST', url: '/auth/login',
    payload: { email: 'brigade-rpt-test@geocoding.ma', password: 'password123' }
  })
  tokenBrigade = loginBrigade.json().token

  const loginIGT = await app.inject({
    method: 'POST', url: '/auth/login',
    payload: { email: 'igt-rpt-test@geocoding.ma', password: 'password123' }
  })
  tokenIGT = loginIGT.json().token

  // ── Prépare les données de test ────────────────────────────────────────────

  // Date dans le mois courant
  const dateFiche = new Date()
  dateFiche.setDate(5) // le 5 du mois courant

  // Crée une fiche
  const ficheRes = await app.inject({
    method: 'POST', url: '/fiches',
    headers: { authorization: `Bearer ${tokenBrigade}` },
    payload: { date: dateFiche.toISOString().split('T')[0] }
  })
  const ficheId = ficheRes.json().fiche.id

  // Crée une mission
  const missionRes = await app.inject({
    method: 'POST', url: `/fiches/${ficheId}/missions`,
    headers: { authorization: `Bearer ${tokenBrigade}` },
    payload: { ouvrageId }
  })
  const missionId = missionRes.json().mission.id

  // Démarre la mission
  await app.inject({
    method: 'PATCH', url: `/fiches/${ficheId}/missions/${missionId}`,
    headers: { authorization: `Bearer ${tokenBrigade}` },
    payload: { heureDebut: new Date().toISOString() }
  })

  // Ajoute des contrôles
  await app.inject({
    method: 'POST', url: `/fiches/${ficheId}/missions/${missionId}/controles`,
    headers: { authorization: `Bearer ${tokenBrigade}` },
    payload: { type: 'IMPLANTATION', ecartX: 2, toleranceX: 5 }
    // CONFORME
  })

  await app.inject({
    method: 'POST', url: `/fiches/${ficheId}/missions/${missionId}/controles`,
    headers: { authorization: `Bearer ${tokenBrigade}` },
    payload: { type: 'ALTIMETRIE', ecartZ: 8, toleranceZ: 3 }
    // NON_CONFORME
  })

  // Soumet la fiche
  await app.inject({
    method: 'POST', url: `/fiches/${ficheId}/soumettre`,
    headers: { authorization: `Bearer ${tokenBrigade}` }
  })

  // Valide la fiche (IGT)
  await app.inject({
    method: 'POST', url: `/fiches/${ficheId}/valider`,
    headers: { authorization: `Bearer ${tokenIGT}` }
  })
})

afterAll(async () => {
  // Nettoyage
  const users = await prisma.user.findMany({
    where: { email: { in: ['brigade-rpt-test@geocoding.ma', 'igt-rpt-test@geocoding.ma'] } }
  })

  for (const user of users) {
    const fiches = await prisma.ficheJournaliere.findMany({ where: { createurId: user.id } })
    for (const fiche of fiches) {
      const missions = await prisma.mission.findMany({ where: { ficheId: fiche.id } })
      for (const m of missions) {
        await prisma.controle.deleteMany({ where: { missionId: m.id } })
      }
      await prisma.mission.deleteMany({ where: { ficheId: fiche.id } })
    }
    await prisma.ficheJournaliere.deleteMany({ where: { createurId: user.id } })
  }

  await prisma.user.deleteMany({
    where: { email: { in: ['brigade-rpt-test@geocoding.ma', 'igt-rpt-test@geocoding.ma'] } }
  })
  await prisma.brigade.deleteMany({ where: { nom: 'Brigade Rapport Test' } })
  await prisma.ouvrage.deleteMany({ where: { reference: 'RPT-TEST-001' } })
  await prisma.$disconnect()
  await app.close()
})

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('GET /rapports/:brigadeId/:periode', () => {

  it('IGT génère un rapport mensuel', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/rapports/${brigadeId}/${periode}`,
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.success).toBe(true)
    expect(body.rapport).toHaveProperty('nbFichesValidees')
    expect(body.rapport).toHaveProperty('nbMissions')
    expect(body.rapport).toHaveProperty('nbControles')
    expect(body.rapport).toHaveProperty('tauxConformite')
    expect(body.rapport).toHaveProperty('ouvragesNonConformes')
    expect(body.rapport.periode).toBe(periode)
  })

  it('statistiques correctes — 1 fiche, 1 mission, 2 contrôles', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/rapports/${brigadeId}/${periode}`,
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    const rapport = response.json().rapport
    expect(rapport.nbFichesValidees).toBe(1)
    expect(rapport.nbMissions).toBe(1)
    expect(rapport.nbControles).toBe(2)
    expect(rapport.nbConformes).toBe(1)
    expect(rapport.nbNonConformes).toBe(1)
    expect(rapport.tauxConformite).toBe(50)
  })

  it('identifie l\'ouvrage NON_CONFORME', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/rapports/${brigadeId}/${periode}`,
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    const rapport = response.json().rapport
    expect(rapport.ouvragesNonConformes).toHaveLength(1)
    expect(rapport.ouvragesNonConformes[0].reference).toBe('RPT-TEST-001')
  })

  it('Brigade peut voir son propre rapport', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/rapports/${brigadeId}/${periode}`,
      headers: { authorization: `Bearer ${tokenBrigade}` }
    })

    expect(response.statusCode).toBe(200)
  })

  it('retourne 400 pour période invalide', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/rapports/${brigadeId}/2026-13`,
      // mois 13 → invalide
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().code).toBe('PERIODE_INVALIDE')
  })

  it('retourne 404 pour brigade inexistante', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/rapports/brigade-inexistante/${periode}`,
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(404)
  })

  it('retourne 401 sans token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/rapports/${brigadeId}/${periode}`
    })

    expect(response.statusCode).toBe(401)
  })
})

describe('GET /rapports/:brigadeId', () => {

  it('retourne la liste des rapports de l\'année', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/rapports/${brigadeId}`,
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.rapports).toBeInstanceOf(Array)
    expect(body.total).toBeGreaterThan(0)
  })

  it('filtre par année', async () => {
    const anneeEnCours = new Date().getFullYear()
    const response = await app.inject({
      method: 'GET',
      url: `/rapports/${brigadeId}?annee=${anneeEnCours}`,
      headers: { authorization: `Bearer ${tokenIGT}` }
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    body.rapports.forEach((r: any) => {
      expect(r.periode).toContain(String(anneeEnCours))
    })
  })
})