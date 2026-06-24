/**
 * @file seed-juin2026.ts
 * @description Seeder réaliste — Équipe 01 Juin 2026
 * VERSION COMPATIBLE — pas d'imports d'enums Prisma
 * USAGE : cd apps/api && pnpm exec tsx ../../prisma/seed-juin2026.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

function date(jour: number): Date {
  return new Date(2026, 5, jour, 8, 0, 0, 0)
}

async function main() {
  console.log('🌱 Seeding Juin 2026 — Équipe 01...')

  // ── NETTOYAGE ─────────────────────────────────────────────────
  await prisma.photo.deleteMany()
  await prisma.controle.deleteMany()
  await prisma.mission.deleteMany()
  await prisma.ficheJournaliere.deleteMany()
  await prisma.pointVigilanceCP.deleteMany()
  await prisma.evenementCP.deleteMany()
  await prisma.compteRenduCP.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.ouvrage.deleteMany()
  await prisma.brigade.deleteMany()
  console.log('🧹 Tables nettoyées')

  // ── BRIGADES ──────────────────────────────────────────────────
  const brigade1 = await prisma.brigade.create({ data: { nom: 'Équipe 01', chef: 'M. Marouane AIT KADIR' } })
  const brigade2 = await prisma.brigade.create({ data: { nom: 'Équipe 02', chef: 'M. Youssef BENNANI' } })

  // ── UTILISATEURS ─────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10)
  await prisma.user.create({ data: { nom: 'CHAACHOUI', prenom: 'Hakim', email: 'admin@geocoding.ma', password: hash, role: 'ADMIN' } })
  const igt = await prisma.user.create({ data: { nom: 'BOUDI', prenom: 'Salah-eddine', email: 'igt@geocoding.ma', password: hash, role: 'IGT' } })
  const chef1 = await prisma.user.create({ data: { nom: 'AIT KADIR', prenom: 'Marouane', email: 'equipe01@geocoding.ma', password: hash, role: 'BRIGADE', brigadeId: brigade1.id, gsm: '+212 661 234 567', stationTotale: 'Trimble SX12 — S/N 987654' } })
  await prisma.user.create({ data: { nom: 'BENNANI', prenom: 'Youssef', email: 'equipe02@geocoding.ma', password: hash, role: 'BRIGADE', brigadeId: brigade2.id, gsm: '+212 631 434 567', stationTotale: 'Trimble SX12 — S/N 997654' } })

  console.log('✅ Brigades et utilisateurs créés')

  // ── OUVRAGES ──────────────────────────────────────────────────
  const ouvrages = await Promise.all([
    /* 0  */ prisma.ouvrage.create({ data: { reference: 'POT-AV-A01', designation: 'Poteau AV Tribune A Axe 1',       type: 'POTEAU_AV_BETONNAGE',            axe: 'Axe A01' } }),
    /* 1  */ prisma.ouvrage.create({ data: { reference: 'POT-AV-A02', designation: 'Poteau AV Tribune A Axe 2',       type: 'POTEAU_AV_BETONNAGE',            axe: 'Axe A02' } }),
    /* 2  */ prisma.ouvrage.create({ data: { reference: 'POT-AP-B01', designation: 'Poteau AP Tribune B Axe 1',       type: 'POTEAU_AP_BETONNAGE',            axe: 'Axe B01' } }),
    /* 3  */ prisma.ouvrage.create({ data: { reference: 'CRE-AV-A01', designation: 'Poutre crémaillère AV Tribune A', type: 'POUTRE_CREMAILLERE_AV_BETONNAGE', axe: 'Axe A'   } }),
    /* 4  */ prisma.ouvrage.create({ data: { reference: 'CRE-AP-A02', designation: 'Poutre crémaillère AP Tribune A', type: 'POUTRE_CREMAILLERE_AP_BETONNAGE', axe: 'Axe A'   } }),
    /* 5  */ prisma.ouvrage.create({ data: { reference: 'CRE-AV-B01', designation: 'Poutre crémaillère AV Tribune B', type: 'POUTRE_CREMAILLERE_AV_BETONNAGE', axe: 'Axe B'   } }),
    /* 6  */ prisma.ouvrage.create({ data: { reference: 'GRA-A01',    designation: 'Gradin béton Tribune A rang 1',   type: 'GRADIN',                          axe: 'Axe A'   } }),
    /* 7  */ prisma.ouvrage.create({ data: { reference: 'VOI-AV-A01', designation: 'Voile AV béton Tribune A',        type: 'VOILE_AV_BETONNAGE',             axe: 'Axe A'   } }),
    /* 8  */ prisma.ouvrage.create({ data: { reference: 'VOI-AP-A01', designation: 'Voile AP béton Tribune A',        type: 'VOILE_AP_BETONNAGE',             axe: 'Axe A'   } }),
    /* 9  */ prisma.ouvrage.create({ data: { reference: 'CHB-A01',    designation: 'Chambord Tribune A',              type: 'CHAMBORD',                        axe: 'Axe A'   } }),
    /* 10 */ prisma.ouvrage.create({ data: { reference: 'SEM-F-A01',  designation: 'Semelle filante Tribune A',       type: 'SEMELLE_FILANTE',                 axe: 'Axe A'   } }),
    /* 11 */ prisma.ouvrage.create({ data: { reference: 'ASS-A01',    designation: 'Assainissement Zone A',           type: 'ASSAINISSEMENT',                  axe: 'Zone A'  } }),
    /* 12 */ prisma.ouvrage.create({ data: { reference: 'VOM-A01',    designation: 'Vomitoire Tribune A',             type: 'VOMITOIRE',                       axe: 'Axe A'   } }),
    /* 13 */ prisma.ouvrage.create({ data: { reference: 'DAL-A01',    designation: 'Dalles Tribune A',                type: 'DALLES',                          axe: 'Axe A'   } }),
    /* 14 */ prisma.ouvrage.create({ data: { reference: 'MUR-A01',    designation: 'Mur de soutènement Zone A',      type: 'MUR_SOUTENEMENT',                 axe: 'Zone A'  } }),
  ])
  console.log('✅ Ouvrages créés')

  // ── HELPER MISSION ────────────────────────────────────────────
  async function mission(ficheId: string, ouvrageIdx: number, opts: {
    zone?:                    string
    axe?:                     string
    fil?:                     string
    niveau?:                  string
    partieOuvrage?:           string
    nature?:                  string
    provenanceAppareil?:      string
    nomAppareil?:             string
    stadeCollage?:            string
    resultat:                 string
    observations?:            string
    categorieAssainissement?: string
    ecartX?: number; ecartY?: number; ecartZ?: number
  }) {
    const o      = ouvrages[ouvrageIdx]
    const estNC  = opts.resultat === 'NON_CONFORME'
    const statut = opts.resultat === 'CONFORME' ? 'CONFORME' : opts.resultat === 'RESERVE' ? 'RESERVE' : 'NON_CONFORME'

    return prisma.mission.create({
      data: {
        ficheId,
        ouvrageId:               o.id,
        typeOuvrage:             o.type as any,
        zone:                    (opts.zone ?? 'A') as any,
        axe:                     opts.axe ?? o.axe ?? '',
        fil:                     opts.fil ?? null,
        niveau:                  opts.niveau ?? 'RDC',
        partieOuvrage:           opts.partieOuvrage ?? o.designation,
        nature:                  (opts.nature ?? 'CONTROLE_GEOMETRIQUE') as any,
        provenanceAppareil:      (opts.provenanceAppareil ?? 'GEOCODING') as any,
        nomAppareil:             opts.nomAppareil ?? 'Trimble SX12',
        stadeCollage:            (opts.stadeCollage ?? null) as any,
        resultat:                opts.resultat as any,
        estNC,
        observations:            opts.observations ?? null,
        categorieAssainissement: (opts.categorieAssainissement ?? null) as any,
        controles: {
          create: [{
            type:       'IMPLANTATION' as any,
            statut:     statut as any,
            ecartX:     opts.ecartX ?? (estNC ? 12.3 : opts.resultat === 'RESERVE' ? 5.8 : 2.1),
            ecartY:     opts.ecartY ?? (estNC ? 9.7  : opts.resultat === 'RESERVE' ? 4.9 : 1.8),
            ecartZ:     opts.ecartZ ?? (estNC ? 7.5  : opts.resultat === 'RESERVE' ? 3.1 : 1.2),
            toleranceX: 5.0, toleranceY: 5.0, toleranceZ: 3.0,
            observations: opts.observations ?? null
          }]
        }
      }
    })
  }

  // ── FICHE 1 — Mardi 2 juin — VALIDÉE ─────────────────────────
  const f1 = await prisma.ficheJournaliere.create({ data: { date: date(2), statut: 'VALIDEE', conditionMeteo: 'BEAU', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Bonnes conditions — Tribune A axe 1-3' } })
  await mission(f1.id, 0, { axe: 'A01', fil: 'M', partieOuvrage: 'Axe A01 fil M', nature: 'IMPLANTATION', resultat: 'CONFORME' })
  await mission(f1.id, 1, { axe: 'A02', fil: 'M', partieOuvrage: 'Axe A02 fil M', nature: 'IMPLANTATION', resultat: 'CONFORME' })
  await mission(f1.id, 3, { axe: 'A01', partieOuvrage: 'Poutre crémaillère inférieure Axe A C1-C2', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME' })

  // ── FICHE 2 — Mercredi 3 juin — VALIDÉE ──────────────────────
  const f2 = await prisma.ficheJournaliere.create({ data: { date: date(3), statut: 'VALIDEE', conditionMeteo: 'NUAGEUX', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Contrôle crémaillères AP et voiles AV' } })
  await mission(f2.id, 4, { axe: 'A02', partieOuvrage: 'Poutre crémaillère AP Axe A C2-C3', nature: 'RECEPTION_AVANT_BETONNAGE', stadeCollage: 'PREMIERE_LEVEE', resultat: 'CONFORME' })
  await mission(f2.id, 4, { axe: 'A03', partieOuvrage: 'Poutre crémaillère AP Axe A C3-C4', nature: 'RECEPTION_AVANT_BETONNAGE', stadeCollage: 'PREMIERE_LEVEE', resultat: 'NON_CONFORME', observations: 'Écarts hors tolérances — reprise nécessaire', ecartX: 12.3, ecartY: 8.7 })
  await mission(f2.id, 7, { axe: 'D04', partieOuvrage: 'Axe D04 et D06', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME' })

  // ── FICHE 3 — Jeudi 4 juin — VALIDÉE ─────────────────────────
  const f3 = await prisma.ficheJournaliere.create({ data: { date: date(4), statut: 'VALIDEE', conditionMeteo: 'BEAU', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Voiles et gradins Tribune A' } })
  await mission(f3.id, 7, { axe: 'D08', fil: 'F', partieOuvrage: 'Fil F Axe D8-D9',    nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME' })
  await mission(f3.id, 8, { axe: 'C25', fil: 'M', partieOuvrage: 'Fil M Axe C25-D1',   nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME' })
  await mission(f3.id, 6, { axe: 'A01', partieOuvrage: 'coffrage de voile AP',          nature: 'CONTROLE_COFFRAGE',    resultat: 'RESERVE', observations: 'Légère déviation axe X', ecartX: 5.8 })

  // ── FICHE 4 — Vendredi 5 juin — VALIDÉE — ASSAINISSEMENT ─────
  const f4 = await prisma.ficheJournaliere.create({ data: { date: date(5), statut: 'VALIDEE', conditionMeteo: 'BEAU', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Assainissement Zone C' } })
  await mission(f4.id, 11, { axe: 'Zone C', partieOuvrage: "Fil d'eau Coll R1-R5",   nature: 'CONTROLE_FIL_EAU',     resultat: 'CONFORME', categorieAssainissement: 'FIL_EAU',        nomAppareil: 'Leica NA730' })
  await mission(f4.id, 11, { axe: 'Zone C', partieOuvrage: 'FOND DE FOUILLE Zone C', nature: 'CONTROLE_FOND_FOUILLE', resultat: 'CONFORME', categorieAssainissement: 'FOND_DE_FOUILLE', nomAppareil: 'Leica NA730' })
  await mission(f4.id, 11, { axe: 'Zone C', partieOuvrage: 'Cote radier Zone C',     nature: 'CONTROLE_COTE_RADIER', resultat: 'CONFORME', categorieAssainissement: 'COTE_RADIER',    nomAppareil: 'Leica NA730' })

  // ── FICHE 5 — Lundi 9 juin — VALIDÉE ─────────────────────────
  const f5 = await prisma.ficheJournaliere.create({ data: { date: date(9), statut: 'VALIDEE', conditionMeteo: 'BEAU', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Gradins et chambord Tribune A' } })
  await mission(f5.id, 6, { axe: 'A25', partieOuvrage: 'Gradin entre Axe A25-B1',   nature: 'RECEPTION_AVANT_BETONNAGE', stadeCollage: 'PREMIERE_LEVEE', resultat: 'CONFORME' })
  await mission(f5.id, 6, { axe: 'B01', partieOuvrage: 'Gradin entre Axe B1-B2',    nature: 'RECEPTION_AVANT_BETONNAGE', stadeCollage: 'PREMIERE_LEVEE', resultat: 'CONFORME' })
  await mission(f5.id, 9, { axe: 'A13', partieOuvrage: 'coffrage voile chambord 13', nature: 'CONTROLE_COFFRAGE',         resultat: 'CONFORME' })

  // ── FICHE 6 — Mardi 10 juin — VALIDÉE ────────────────────────
  const f6 = await prisma.ficheJournaliere.create({ data: { date: date(10), statut: 'VALIDEE', conditionMeteo: 'NUAGEUX', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Semelles et mur de soutènement' } })
  await mission(f6.id, 10, { axe: 'A01', partieOuvrage: 'Semelle filante Axe A01-A05',       nature: 'CONTROLE_GEOMETRIQUE',       resultat: 'CONFORME' })
  await mission(f6.id, 14, { axe: 'A01', partieOuvrage: 'Mur de soutènement Zone A Nord',    nature: 'CONTROLE_GEOMETRIQUE',       resultat: 'CONFORME' })
  await mission(f6.id, 2,  { axe: 'B01', partieOuvrage: 'Poteau AP Tribune B01',              nature: 'RECEPTION_AVANT_BETONNAGE',  stadeCollage: 'DEUXIEME_COLLAGE', resultat: 'CONFORME' })

  // ── FICHE 7 — Mercredi 11 juin — VALIDÉE ─────────────────────
  const f7 = await prisma.ficheJournaliere.create({ data: { date: date(11), statut: 'VALIDEE', conditionMeteo: 'BEAU', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Vomitoires et dalles' } })
  await mission(f7.id, 12, { axe: 'B07', partieOuvrage: 'Vomitoire Tribune A axe B7',    nature: 'IMPLANTATION',        resultat: 'CONFORME' })
  await mission(f7.id, 13, { axe: 'B01', partieOuvrage: 'Dalles Tribune B rangs 1-3',    nature: 'CONTROLE_NIVELLEMENT', resultat: 'NON_CONFORME', observations: 'Désafleurement important', ecartZ: 9.2, nomAppareil: 'Leica NA730' })

  // ── FICHE 8 — Jeudi 12 juin — VALIDÉE ────────────────────────
  const f8 = await prisma.ficheJournaliere.create({ data: { date: date(12), statut: 'VALIDEE', conditionMeteo: 'BEAU', brigadeId: brigade1.id, createurId: chef1.id, validateurId: igt.id, observations: 'Crémaillères Tribune B — 2ème collage' } })
  await mission(f8.id, 3, { axe: 'B05', partieOuvrage: 'Poutre crémaillère AV Tribune B Axe B5', nature: 'IMPLANTATION',        stadeCollage: 'DEUXIEME_COLLAGE', resultat: 'CONFORME' })
  await mission(f8.id, 3, { axe: 'B06', partieOuvrage: 'Poutre crémaillère AV Tribune B Axe B6', nature: 'IMPLANTATION',        stadeCollage: 'DEUXIEME_COLLAGE', resultat: 'CONFORME' })
  await mission(f8.id, 5, { axe: 'B07', partieOuvrage: 'Poutre crémaillère AV Tribune B Axe B7', nature: 'CONTROLE_GEOMETRIQUE', stadeCollage: 'DEUXIEME_COLLAGE', resultat: 'RESERVE', observations: 'Tolérance limite', ecartX: 4.9 })

  // ── FICHE 9 — Vendredi 13 juin — SOUMISE ─────────────────────
  const f9 = await prisma.ficheJournaliere.create({ data: { date: date(13), statut: 'SOUMISE', conditionMeteo: 'NUAGEUX', brigadeId: brigade1.id, createurId: chef1.id, observations: 'Journée assainissement — coffrage' } })
  await mission(f9.id, 11, { axe: 'Zone B', partieOuvrage: 'Coffrage RADIER Zone B',    nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME', categorieAssainissement: 'COFFRAGE_RADIER' })
  await mission(f9.id, 11, { axe: 'Zone B', partieOuvrage: 'Voile du regard AP Zone B', nature: 'CONTROLE_GEOMETRIQUE', resultat: 'CONFORME', categorieAssainissement: 'VOILE_REGARD_AP_BETONNAGE' })

  // ── FICHE 10 — Lundi 16 juin — BROUILLON ─────────────────────
  const f10 = await prisma.ficheJournaliere.create({ data: { date: date(16), statut: 'BROUILLON', conditionMeteo: 'BEAU', brigadeId: brigade1.id, createurId: chef1.id } })
  await mission(f10.id, 0, { axe: 'A20', fil: 'C', partieOuvrage: 'Axe A20 fil C', nature: 'IMPLANTATION', resultat: 'CONFORME' })

  // ── RÉSUMÉ ────────────────────────────────────────────────────
  const counts = {
    brigades:  await prisma.brigade.count(),
    users:     await prisma.user.count(),
    ouvrages:  await prisma.ouvrage.count(),
    fiches:    await prisma.ficheJournaliere.count(),
    missions:  await prisma.mission.count(),
    controles: await prisma.controle.count(),
  }
  const nbNC = await prisma.mission.count({ where: { estNC: true } })

  console.log('\n📊 Résumé :')
  Object.entries(counts).forEach(([k, v]) => console.log(`   ${v} ${k}`))
  console.log(`   ${nbNC} missions NC (estNC=true)`)
  console.log('\n🎉 Seeding Juin 2026 terminé !')
  console.log('📋 Fiches VALIDÉES Équipe 01 : 8 (du 2 au 12 juin)')
}

main().catch(console.error).finally(() => prisma.$disconnect())