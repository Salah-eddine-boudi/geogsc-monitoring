/**
 * @file seed-juin2026.ts
 * @description Seeder réaliste — Équipe 01 Juin 2026
 * Simule un mois complet de travail topographique GSC.
 * Lance depuis apps/api : pnpm exec tsx ../../prisma/seed-juin2026.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Helper — crée une date en juin 2026 à une heure fixe (pas d'heure aléatoire)
function date(jour: number): Date {
  return new Date(2026, 5, jour, 8, 0, 0, 0) // juin = mois 5 (0-indexé)
}

async function main() {
  console.log('🌱 Seeding Juin 2026 — Équipe 01...')

  // ── NETTOYAGE ───────────────────────────────────────────────────
  await prisma.controle.deleteMany()
  await prisma.mission.deleteMany()
  await prisma.ficheJournaliere.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.ouvrage.deleteMany()
  await prisma.brigade.deleteMany()
  console.log('🧹 Tables nettoyées')

  // ── BRIGADES ────────────────────────────────────────────────────
  const brigade1 = await prisma.brigade.create({
    data: { nom: 'Équipe 01', chef: 'M. Marouane AIT KADIR' }
  })
  const brigade2 = await prisma.brigade.create({
    data: { nom: 'Équipe 02', chef: 'M. Youssef BENNANI' }
  })

  // ── UTILISATEURS ─────────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10)
  await prisma.user.create({ data: { nom: 'CHAACHOUI', prenom: 'Hakim', email: 'admin@geocoding.ma', password: hash, role: 'ADMIN' } })
  const igt   = await prisma.user.create({ data: { nom: 'BOUDI', prenom: 'Salah-eddine', email: 'igt@geocoding.ma', password: hash, role: 'IGT' } })
  const chef1 = await prisma.user.create({ data: { nom: 'AIT KADIR', prenom: 'Marouane', email: 'equipe01@geocoding.ma', password: hash, role: 'BRIGADE', brigadeId: brigade1.id } })
  const chef2 = await prisma.user.create({ data: { nom: 'BENNANI', prenom: 'Youssef', email: 'equipe02@geocoding.ma', password: hash, role: 'BRIGADE', brigadeId: brigade2.id } })

  console.log('✅ Brigades et utilisateurs créés')

  // ── OUVRAGES ─────────────────────────────────────────────────────
  const ouvrages = await Promise.all([
    prisma.ouvrage.create({ data: { reference: 'POT-AV-A01', designation: 'Poteau AV Tribune A Axe 1', type: 'POTEAU_AV_BETONNAGE', axe: 'Axe A01' } }),
    prisma.ouvrage.create({ data: { reference: 'POT-AV-A02', designation: 'Poteau AV Tribune A Axe 2', type: 'POTEAU_AV_BETONNAGE', axe: 'Axe A02' } }),
    prisma.ouvrage.create({ data: { reference: 'POT-AP-B01', designation: 'Poteau AP Tribune B Axe 1', type: 'POTEAU_AP_BETONNAGE', axe: 'Axe B01' } }),
    prisma.ouvrage.create({ data: { reference: 'CRE-AV-A01', designation: 'Poutre crémaillère AV Tribune A', type: 'POUTRE_CREMAILLERE_AV_BETONNAGE', axe: 'Axe A' } }),
    prisma.ouvrage.create({ data: { reference: 'CRE-AP-A02', designation: 'Poutre crémaillère AP Tribune A', type: 'POUTRE_CREMAILLERE_AP_BETONNAGE', axe: 'Axe A' } }),
    prisma.ouvrage.create({ data: { reference: 'CRE-AV-B01', designation: 'Poutre crémaillère AV Tribune B', type: 'POUTRE_CREMAILLERE_AV_BETONNAGE', axe: 'Axe B' } }),
    prisma.ouvrage.create({ data: { reference: 'GRA-A01', designation: 'Gradin béton Tribune A rang 1', type: 'GRADIN', axe: 'Axe A' } }),
    prisma.ouvrage.create({ data: { reference: 'VOI-AV-A01', designation: 'Voile AV béton Tribune A', type: 'VOILE_AV_BETONNAGE', axe: 'Axe A' } }),
    prisma.ouvrage.create({ data: { reference: 'VOI-AP-A01', designation: 'Voile AP béton Tribune A', type: 'VOILE_AP_BETONNAGE', axe: 'Axe A' } }),
    prisma.ouvrage.create({ data: { reference: 'CHB-A01', designation: 'Chambord Tribune A', type: 'CHAMBORD', axe: 'Axe A' } }),
    prisma.ouvrage.create({ data: { reference: 'SEM-F-A01', designation: 'Semelle filante Tribune A', type: 'SEMELLE_FILANTE', axe: 'Axe A' } }),
    prisma.ouvrage.create({ data: { reference: 'ASS-A01', designation: 'Assainissement Zone A', type: 'ASSAINISSEMENT', axe: 'Zone A' } }),
    prisma.ouvrage.create({ data: { reference: 'VOM-A01', designation: 'Vomitoire Tribune A', type: 'VOMITOIRE', axe: 'Axe A' } }),
    prisma.ouvrage.create({ data: { reference: 'DAL-A01', designation: 'Dalles Tribune A', type: 'DALLES', axe: 'Axe A' } }),
    prisma.ouvrage.create({ data: { reference: 'MUR-A01', designation: 'Mur de soutènement Zone A', type: 'MUR_SOUTENEMENT', axe: 'Zone A' } }),
  ])

  console.log('✅ Ouvrages créés')

  // ── HELPER création mission + contrôles ──────────────────────────
  async function mission(ficheId: string, ouvrageIdx: number, opts: {
    zone?: string, axe?: string, fil?: string, niveau?: string,
    partieOuvrage?: string, nature?: string, appareil?: string,
    resultat: string, observations?: string,
    categorieAssainissement?: string
    ecartX?: number, ecartY?: number, ecartZ?: number
  }) {
    const o = ouvrages[ouvrageIdx]
    const conforme = opts.resultat === 'CONFORME'
    const reserve  = opts.resultat === 'RESERVE'
    const nc       = opts.resultat === 'NON_CONFORME'

    return prisma.mission.create({
      data: {
        ficheId,
        ouvrageId: o.id,
        typeOuvrage: o.type as any,
        zone: (opts.zone ?? 'A') as any,
        axe: opts.axe ?? o.axe ?? '',
        fil: opts.fil,
        niveau: opts.niveau ?? 'RDC',
        partieOuvrage: opts.partieOuvrage ?? o.designation,
        nature: (opts.nature ?? 'CONTROLE_GEOMETRIQUE') as any,
        appareil: (opts.appareil ?? 'TRIMBLE_SX12') as any,
        conditionMeteo: 'BEAU' as any,
        resultat: opts.resultat,
        observations: opts.observations ?? null,
        categorieAssainissement: opts.categorieAssainissement as any ?? null,
        controles: {
          create: [{
            type: 'IMPLANTATION' as any,
            statut: (conforme ? 'CONFORME' : reserve ? 'RESERVE' : 'NON_CONFORME') as any,
            ecartX: opts.ecartX ?? (conforme ? 2.1 : reserve ? 5.8 : 12.3),
            ecartY: opts.ecartY ?? (conforme ? 1.8 : reserve ? 4.9 : 9.7),
            ecartZ: opts.ecartZ ?? (conforme ? 1.2 : reserve ? 3.1 : 7.5),
            toleranceX: 5.0, toleranceY: 5.0, toleranceZ: 3.0,
            observations: opts.observations ?? null
          }]
        }
      }
    })
  }

  // ── FICHE 1 — Lundi 2 juin — VALIDÉE ───────────────────────────
  const f1 = await prisma.ficheJournaliere.create({
    data: { date: date(2), statut: 'VALIDEE', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Bonnes conditions — Tribune A axe 1-3' }
  })
  await mission(f1.id, 0, { axe: 'Axe A01 fil M', partieOuvrage: 'Axe A01 fil M', nature: 'IMPLANTATION', resultat: 'CONFORME' })
  await mission(f1.id, 1, { axe: 'Axe A02 fil M', partieOuvrage: 'Axe A02 fil M', nature: 'IMPLANTATION', resultat: 'CONFORME' })
  await mission(f1.id, 3, { axe: 'Axe A C1-C2', partieOuvrage: 'Poutre crémaillère inférieure Axe A C1-C2', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME' })

  // ── FICHE 2 — Mardi 3 juin — VALIDÉE ───────────────────────────
  const f2 = await prisma.ficheJournaliere.create({
    data: { date: date(3), statut: 'VALIDEE', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Contrôle crémaillères AP et voiles AV' }
  })
  await mission(f2.id, 4, { axe: 'Axe A C2-C3', partieOuvrage: 'Poutre crémaillère AP Axe A C2-C3', nature: 'RECEPTION', resultat: 'CONFORME' })
  await mission(f2.id, 4, { axe: 'Axe A C3-C4', partieOuvrage: 'Poutre crémaillère AP Axe A C3-C4', nature: 'RECEPTION', resultat: 'NON_CONFORME', observations: 'Écarts hors tolérances — reprise nécessaire', ecartX: 12.3, ecartY: 8.7 })
  await mission(f2.id, 7, { axe: 'Axe D04-D06', partieOuvrage: 'Axe D04 et D06', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME' })

  // ── FICHE 3 — Mercredi 4 juin — VALIDÉE ─────────────────────────
  const f3 = await prisma.ficheJournaliere.create({
    data: { date: date(4), statut: 'VALIDEE', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Voiles et gradins Tribune A' }
  })
  await mission(f3.id, 7, { axe: 'Fil F Axe D8-D9', partieOuvrage: 'Fil F Axe D8-D9', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME' })
  await mission(f3.id, 8, { axe: 'Fil M Axe C25-D1', partieOuvrage: 'Fil M Axe C25-D1', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME' })
  await mission(f3.id, 6, { axe: 'Axe A voile V01', partieOuvrage: 'coffrage de voile AP', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'RESERVE', observations: 'Légère déviation axe X', ecartX: 5.8 })

  // ── FICHE 4 — Jeudi 5 juin — VALIDÉE ───────────────────────────
  const f4 = await prisma.ficheJournaliere.create({
    data: { date: date(5), statut: 'VALIDEE', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Assainissement Zone C' }
  })
  await mission(f4.id, 11, { axe: 'Zone C', partieOuvrage: "Fil d'eau Coll entre R1-R5", nature: 'CONTROLE_ALTIMETRIQUE', resultat: 'CONFORME', categorieAssainissement: 'FIL_EAU', observations: 'Reseaux sous dallage Zone C', appareil: 'LEICA_NA730' })
  await mission(f4.id, 11, { axe: 'Zone C', partieOuvrage: 'FOND DE FOUILLE Zone C radier', nature: 'CONTROLE_ALTIMETRIQUE', resultat: 'CONFORME', categorieAssainissement: 'FOND_DE_FOUILLE', appareil: 'LEICA_NA730' })
  await mission(f4.id, 11, { axe: 'Zone C', partieOuvrage: 'Cote radier Zone C', nature: 'CONTROLE_ALTIMETRIQUE', resultat: 'CONFORME', categorieAssainissement: 'COTE_RADIER', appareil: 'LEICA_NA730' })

  // ── FICHE 5 — Lundi 9 juin — VALIDÉE ───────────────────────────
  const f5 = await prisma.ficheJournaliere.create({
    data: { date: date(9), statut: 'VALIDEE', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Gradins et chambord' }
  })
  await mission(f5.id, 6, { axe: 'Tribune A rangs 1-5', partieOuvrage: 'Gradin entre Axe A25-B1', nature: 'RECEPTION', resultat: 'CONFORME', appareil: 'TRIMBLE_SX12' })
  await mission(f5.id, 6, { axe: 'Tribune A rangs 6-10', partieOuvrage: 'Gradin entre Axe B1-B2', nature: 'RECEPTION', resultat: 'CONFORME', appareil: 'TRIMBLE_SX12' })
  await mission(f5.id, 9, { axe: 'Axe A', partieOuvrage: 'coffrage de voile de chambord 13', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME' })

  // ── FICHE 6 — Mardi 10 juin — VALIDÉE ──────────────────────────
  const f6 = await prisma.ficheJournaliere.create({
    data: { date: date(10), statut: 'VALIDEE', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Semelles et mur de soutènement' }
  })
  await mission(f6.id, 10, { axe: 'Axe A', partieOuvrage: 'Semelle filante Axe A01-A05', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME' })
  await mission(f6.id, 14, { axe: 'Zone A', partieOuvrage: 'Mur de soutènement Zone A Nord', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME' })
  await mission(f6.id, 2, { axe: 'Axe B01', partieOuvrage: 'Poteau AP Tribune B01', nature: 'RECEPTION', resultat: 'CONFORME' })

  // ── FICHE 7 — Mercredi 11 juin — VALIDÉE ───────────────────────
  const f7 = await prisma.ficheJournaliere.create({
    data: { date: date(11), statut: 'VALIDEE', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Vomitoires et dalles' }
  })
  await mission(f7.id, 12, { axe: 'Axe A', partieOuvrage: 'Vomitoire Tribune A axe B7', nature: 'IMPLANTATION', resultat: 'CONFORME' })
  await mission(f7.id, 13, { axe: 'Axe B', partieOuvrage: 'Dalles Tribune B rangs 1-3', nature: 'CONTROLE_ALTIMETRIQUE', resultat: 'NON_CONFORME', observations: 'Désafleurement important', ecartZ: 9.2, appareil: 'LEICA_NA730' })

  // ── FICHE 8 — Jeudi 12 juin — VALIDÉE ──────────────────────────
  const f8 = await prisma.ficheJournaliere.create({
    data: { date: date(12), statut: 'VALIDEE', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Crémaillères Tribune B' }
  })
  await mission(f8.id, 3, { axe: 'Axe B05', partieOuvrage: 'Poutre crémaillère AV Tribune B Axe B5', nature: 'IMPLANTATION', resultat: 'CONFORME' })
  await mission(f8.id, 3, { axe: 'Axe B06', partieOuvrage: 'Poutre crémaillère AV Tribune B Axe B6', nature: 'IMPLANTATION', resultat: 'CONFORME' })
  await mission(f8.id, 5, { axe: 'Axe B07', partieOuvrage: 'Poutre crémaillère AV Tribune B Axe B7', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'RESERVE', observations: 'Tolérance limite', ecartX: 4.9 })

  // ── FICHE 9 — SOUMISE (en attente validation) ───────────────────
  const f9 = await prisma.ficheJournaliere.create({
    data: { date: date(13), statut: 'SOUMISE', brigadeId: brigade1.id, createurId: chef1.id, observations: 'Journée assainissement coffrage' }
  })
  await mission(f9.id, 11, { axe: 'Zone B', partieOuvrage: 'Coffrage RADIER Zone B', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME', categorieAssainissement: 'COFFRAGE_RADIER' })
  await mission(f9.id, 11, { axe: 'Zone B', partieOuvrage: 'Voile du regard AP Zone B', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME', categorieAssainissement: 'VOILE_REGARD_AP_BETONNAGE' })

  // ── FICHE 10 — BROUILLON ────────────────────────────────────────
  const f10 = await prisma.ficheJournaliere.create({
    data: { date: date(16), statut: 'BROUILLON', brigadeId: brigade1.id, createurId: chef1.id }
  })
  await mission(f10.id, 0, { axe: 'Axe A20 fil C', partieOuvrage: 'Axe A20 fil C', nature: 'IMPLANTATION', resultat: 'CONFORME' })

  const counts = {
    brigades:  await prisma.brigade.count(),
    users:     await prisma.user.count(),
    ouvrages:  await prisma.ouvrage.count(),
    fiches:    await prisma.ficheJournaliere.count(),
    missions:  await prisma.mission.count(),
    controles: await prisma.controle.count(),
  }

  console.log('\n📊 Résumé :')
  Object.entries(counts).forEach(([k, v]) => console.log(`   ${v} ${k}`))
  console.log('\n🎉 Seeding Juin 2026 terminé !')
  console.log('\n📋 Fiches VALIDÉES Équipe 01 : 8 fiches (2 juin → 12 juin)')
  console.log('   → Exporter : GET /export/excel/[brigadeId]/2026-06')
}

main().catch(console.error).finally(() => prisma.$disconnect())