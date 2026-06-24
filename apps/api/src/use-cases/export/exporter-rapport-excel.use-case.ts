/**
 * @file exporter-rapport-excel.use-case.ts
 * @description Génère le fichier Excel CUMULATIF par brigade.
 *
 * FORMAT EXACT fichier original GEOCODING :
 * - Un seul fichier par brigade pour tout le projet
 * - Un onglet par mois
 * - TOUS les jours du mois affichés (ligne vide si pas de missions)
 * - TOUTES les colonnes toujours présentes (vides si non utilisées)
 *
 * STRUCTURE : Jour | Date | OUVRAGE (19 cols) | PIEUX (3 cols) | ASSAINISSEMENT (12 cols) | Partie | CONFORME | Fiche | Obs
 */

import ExcelJS from 'exceljs'
import { prisma } from '../../infrastructure/prisma/prisma.js'
import { NotFoundError } from '../../domain/errors.js'

// ── COLONNES FIXES ────────────────────────────────────────────────

const COLS_OUVRAGES = [
  'Poteau AV bétonnage',
  'Poteau AP bétonnage',
  'Poutre crémaillère AV bétonnage',
  'Poutre crémaillère AP bétonnage',
  'fixation boulons cremailleres AV bétonnage',
  'fixation boulons cremailleres AP bétonnage',
  'Gradins',
  'Support de gradin',
  'Voile AV bétonnage',
  'Voile AP bétonnage',
  'Chambord',
  'Vomitoire',
  'Semelle filante',
  'Semelle isoleé',
  'Dalles AV bétonnage',
  'Dalles AP bétonnage',
  'Mur de soutènment',
  'terrassement',
  'Autre',
] as const

const COLS_PIEUX = [
  'Implantation general',
  'Excentrement AV bétonnage',
  'Excentrement AP bétonnage',
] as const

const COLS_ASSAIN = [
  'FOND DE FOUILLE',
  "FIL D'EAU",
  'Lit Pose',
  'coffrage des voiles du regard',
  'Voile du regard AP bétonnage',
  'coffrage RADIER',
  'COTE RADIER',
  'coffrage du dalle',
  'Dalle AP bétonnage',
  'coffrage Gros béton',
  'Gros béton AP bétonnage',
  'Implantation general',
] as const

// ── INDICES COLONNES ──────────────────────────────────────────────
const COL_DEBUT_O = 3
const COL_FIN_O   = COL_DEBUT_O + COLS_OUVRAGES.length - 1
const COL_DEBUT_P = COL_FIN_O + 1
const COL_FIN_P   = COL_DEBUT_P + COLS_PIEUX.length - 1
const COL_DEBUT_A = COL_FIN_P + 1
const COL_FIN_A   = COL_DEBUT_A + COLS_ASSAIN.length - 1
const COL_PARTIE  = COL_FIN_A + 1
const COL_CONF    = COL_PARTIE + 1
const COL_FICHE   = COL_CONF + 1
const COL_OBS     = COL_FICHE + 1
const TOTAL_COLS  = COL_OBS

// ── MAPPING TypeOuvrage → index ───────────────────────────────────
function getIdxOuvrage(type: string, designation: string): number | null {
  const MAP: Record<string, number | null> = {
    POTEAU_AV_BETONNAGE:                        0,
    POTEAU_AP_BETONNAGE:                        1,
    POTEAU:                                     0,
    PLATINE:                                    0,
    POUTRE_CREMAILLERE_AV_BETONNAGE:            2,
    POUTRE_CREMAILLERE_AP_BETONNAGE:            3,
    FIXATION_BOULONS_CREMAILLERES_AV_BETONNAGE: 4,
    FIXATION_BOULONS_CREMAILLERES_AP_BETONNAGE: 5,
    GRADIN:                                     6,
    SUPPORT_GRADIN:                             7,
    VOILE_AV_BETONNAGE:                         8,
    VOILE_AP_BETONNAGE:                         9,
    VOILE:                                      8,
    CHAMBORD:                                   10,
    VOMITOIRE:                                  11,
    SEMELLE_FILANTE:                            12,
    SEMELLE_ISOLEE:                             13,
    DALLES:                                     14,
    DALLES_AV_BETONNAGE:                        14,
    DALLES_AP_BETONNAGE:                        15,
    MUR_SOUTENEMENT:                            16,
    TERRASSEMENT:                               17,
    VRD:                                        17,
    FONDATION:                                  17,
    ASSAINISSEMENT:                             null,
    IMPLANTATION_GENERAL:                       null,
    AUTRE:                                      18,
  }
  if (type in MAP) return MAP[type]
  const label = designation.toLowerCase()
  if (label.includes('poteau'))     return 0
  if (label.includes('crémaillère') || label.includes('cremaillere'))
    return label.includes('ap') ? 3 : 2
  if (label.includes('gradin'))     return 6
  if (label.includes('voile'))      return 8
  if (label.includes('chambord'))   return 10
  if (label.includes('vomitoire'))  return 11
  if (label.includes('semelle'))    return 12
  if (label.includes('dalle'))      return 14
  if (label.includes('mur'))        return 16
  if (label.includes('assainis') || label.includes('fouille') || label.includes('radier'))
    return null
  return 18
}

// ── MAPPING CategorieAssainissement → index ───────────────────────
function getIdxAssain(categorie: string | null, typeOuvrage: string): number | null {
  if (categorie) {
    const MAP: Record<string, number> = {
      FOND_DE_FOUILLE:           0,
      FIL_EAU:                   1,
      LIT_POSE:                  2,
      COFFRAGE_VOILES_REGARD:    3,
      VOILE_REGARD_AP_BETONNAGE: 4,
      COFFRAGE_RADIER:           5,
      COTE_RADIER:               6,
      COFFRAGE_DALLE:            7,
      COFFRAGE_GROS_BETON:       9,
      GROS_BETON_AP_BETONNAGE:   10,
      IMPLANTATION_GENERAL:      11,
    }
    if (MAP[categorie] !== undefined) return MAP[categorie]
  }
  if (typeOuvrage === 'ASSAINISSEMENT') return 0
  return null
}

// ── MAPPING Pieux → index ─────────────────────────────────────────
function getIdxPieux(type: string, nature: string | null): number | null {
  if (type !== 'IMPLANTATION_GENERAL') return null
  if (nature?.includes('AVANT') || nature?.includes('AV')) return 1
  if (nature?.includes('APRES') || nature?.includes('AP')) return 2
  return 0
}

// ── HELPERS ───────────────────────────────────────────────────────
function colLetter(n: number): string {
  if (n <= 26) return String.fromCharCode(64 + n)
  return String.fromCharCode(64 + Math.floor((n - 1) / 26)) +
         String.fromCharCode(64 + ((n - 1) % 26) + 1)
}

function getJourSemaine(date: Date): string {
  return ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][date.getDay()]
}

function nomMoisFr(date: Date): string {
  const mois = ['Janvier','Février','Mars','Avril','Mai','Juin',
                'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
  return `${mois[date.getMonth()]} ${date.getFullYear()}`
}

// ── STYLES ────────────────────────────────────────────────────────
const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, bottom: { style: 'thin' },
  left: { style: 'thin' }, right: { style: 'thin' },
}
const BORDER_MEDIUM_TOP: Partial<ExcelJS.Borders> = {
  top: { style: 'medium' }, bottom: { style: 'thin' },
  left: { style: 'thin' }, right: { style: 'thin' },
}
const ALIGN_CENTER: Partial<ExcelJS.Alignment> = {
  horizontal: 'center', vertical: 'middle', wrapText: true,
}
const ALIGN_LEFT: Partial<ExcelJS.Alignment> = {
  horizontal: 'left', vertical: 'middle', wrapText: true,
}

function styleEntete1(fontSize = 11): Partial<ExcelJS.Style> {
  return { font: { bold: true, size: fontSize }, alignment: ALIGN_CENTER, border: BORDER_THIN }
}

const STYLE_ENTETE2: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 9 }, alignment: ALIGN_CENTER, border: BORDER_THIN,
}

function styleData(isFirst: boolean, center = false): Partial<ExcelJS.Style> {
  return {
    font: { bold: true, size: 9 },
    alignment: center ? ALIGN_CENTER : ALIGN_LEFT,
    border: isFirst ? BORDER_MEDIUM_TOP : BORDER_THIN,
  }
}

// ── GÉNÉRATION ONGLET MENSUEL ─────────────────────────────────────
function genererOngletMois(
  workbook:  ExcelJS.Workbook,
  nomOnglet: string,
  chef:      string,
  moisDate:  Date,
  fiches:    any[]
) {
  const sheet = workbook.addWorksheet(nomOnglet, {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  })

  // Largeurs colonnes
  sheet.getColumn(1).width = 9
  sheet.getColumn(2).width = 10.5
  for (let i = 0; i < COLS_OUVRAGES.length; i++)
    sheet.getColumn(COL_DEBUT_O + i).width = COLS_OUVRAGES[i].length > 12 ? 13 : 9
  for (let i = 0; i < COLS_PIEUX.length; i++)  sheet.getColumn(COL_DEBUT_P + i).width = 12
  for (let i = 0; i < COLS_ASSAIN.length; i++) sheet.getColumn(COL_DEBUT_A + i).width = 12
  sheet.getColumn(COL_PARTIE).width = 32
  sheet.getColumn(COL_CONF).width   = 10
  sheet.getColumn(COL_FICHE).width  = 9
  sheet.getColumn(COL_OBS).width    = 35
  sheet.getRow(8).height = 28.5
  sheet.getRow(9).height = 54.0

  const lastCol = colLetter(TOTAL_COLS)

  // Titre
  sheet.mergeCells(`A1:${lastCol}2`)
  const ct = sheet.getCell('A1')
  ct.value     = 'RAPPORT JOURNALIER DU CONTRÔLE TOPOGRAPHIQUE DU GRAND STADE DE CASABLANCA'
  ct.font      = { bold: false, size: 18, color: { argb: 'FFBFCED0' } }
  ct.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 30

  // Nom
  sheet.getCell('A4').value = 'Nom complet :'
  sheet.getCell('A4').font  = { size: 11 }
  sheet.mergeCells('B4:C4')
  sheet.getCell('B4').value = ` ${chef}`
  sheet.getCell('B4').font  = { size: 10 }

  // Mois
  sheet.getCell('A6').value = 'Mois de Travail :'
  sheet.getCell('A6').font  = { size: 9 }
  sheet.mergeCells('B6:C6')
  sheet.getCell('B6').value = nomMoisFr(moisDate)
  sheet.getCell('B6').font  = { size: 9 }

  // En-têtes niveau 1
  sheet.mergeCells('A8:A9')
  Object.assign(sheet.getCell('A8'), { ...styleEntete1(10), value: 'Jour' })
  sheet.mergeCells('B8:B9')
  Object.assign(sheet.getCell('B8'), { ...styleEntete1(10), value: 'Date' })
  sheet.mergeCells(`${colLetter(COL_DEBUT_O)}8:${colLetter(COL_FIN_O)}8`)
  Object.assign(sheet.getCell(`${colLetter(COL_DEBUT_O)}8`), { ...styleEntete1(12), value: 'Ouvrage' })
  sheet.mergeCells(`${colLetter(COL_DEBUT_P)}8:${colLetter(COL_FIN_P)}8`)
  Object.assign(sheet.getCell(`${colLetter(COL_DEBUT_P)}8`), { ...styleEntete1(12), value: 'Pieux' })
  sheet.mergeCells(`${colLetter(COL_DEBUT_A)}8:${colLetter(COL_FIN_A)}8`)
  Object.assign(sheet.getCell(`${colLetter(COL_DEBUT_A)}8`), { ...styleEntete1(12), value: 'ASSAINISSEMENT' })
  sheet.mergeCells(`${colLetter(COL_PARTIE)}8:${colLetter(COL_PARTIE)}9`)
  Object.assign(sheet.getCell(`${colLetter(COL_PARTIE)}8`), { ...styleEntete1(11), value: "Partie d'Ouvrage" })
  sheet.mergeCells(`${colLetter(COL_CONF)}8:${colLetter(COL_CONF)}9`)
  Object.assign(sheet.getCell(`${colLetter(COL_CONF)}8`), { ...styleEntete1(11), value: 'CONFORME' })
  sheet.mergeCells(`${colLetter(COL_FICHE)}8:${colLetter(COL_FICHE)}9`)
  Object.assign(sheet.getCell(`${colLetter(COL_FICHE)}8`), { ...styleEntete1(11), value: 'Fiche' })
  sheet.mergeCells(`${colLetter(COL_OBS)}8:${colLetter(COL_OBS)}9`)
  Object.assign(sheet.getCell(`${colLetter(COL_OBS)}8`), { ...styleEntete1(11), value: 'Observations' })

  // Sous-en-têtes ligne 9
  COLS_OUVRAGES.forEach((label, i) => Object.assign(sheet.getCell(9, COL_DEBUT_O + i), { ...STYLE_ENTETE2, value: label }))
  COLS_PIEUX.forEach((label, i)    => Object.assign(sheet.getCell(9, COL_DEBUT_P + i), { ...STYLE_ENTETE2, value: label }))
  COLS_ASSAIN.forEach((label, i)   => Object.assign(sheet.getCell(9, COL_DEBUT_A + i), { ...STYLE_ENTETE2, value: label }))

  // ── DONNÉES : tous les jours du mois ──────────────────────────
  let rowIdx = 10

  // Map date → fiche pour accès O(1)
  const ficheParDate = new Map<string, any>()
  for (const fiche of fiches) {
    const d   = new Date(fiche.date)
    // Clé : AAAA-MM-JJ (sans heure pour éviter les décalages UTC)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    ficheParDate.set(key, fiche)
  }

  // Nombre de jours dans le mois (ex: juin = 30)
  const nbJours = new Date(moisDate.getFullYear(), moisDate.getMonth() + 1, 0).getDate()

  for (let jour = 1; jour <= nbJours; jour++) {
    const dateFiche = new Date(moisDate.getFullYear(), moisDate.getMonth(), jour)
    const key       = `${dateFiche.getFullYear()}-${dateFiche.getMonth()}-${dateFiche.getDate()}`
    const fiche     = ficheParDate.get(key)
    const nb        = fiche?.missions?.length ?? 0
    const nbLignes  = Math.max(nb, 1) // au moins 1 ligne par jour

    // Fusionner Jour/Date si plusieurs missions
    if (nbLignes > 1) {
      sheet.mergeCells(rowIdx, 1, rowIdx + nbLignes - 1, 1)
      sheet.mergeCells(rowIdx, 2, rowIdx + nbLignes - 1, 2)
    }

    // Cellule Jour
    const cJour     = sheet.getCell(rowIdx, 1)
    cJour.value     = getJourSemaine(dateFiche)
    cJour.font      = { bold: true, size: 9 }
    cJour.alignment = ALIGN_CENTER
    cJour.border    = BORDER_MEDIUM_TOP

    // Cellule Date
    const cDate     = sheet.getCell(rowIdx, 2)
    cDate.value     = dateFiche
    cDate.numFmt    = 'DD/MM/YYYY'
    cDate.font      = { bold: true, size: 9 }
    cDate.alignment = ALIGN_CENTER
    cDate.border    = BORDER_MEDIUM_TOP
    // Dimanche → fond coloré saumon (comme le fichier original)
const estDimanche = dateFiche.getDay() === 0
if (estDimanche) {
  const fillDimanche: ExcelJS.Fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBA882' }
  }
  cJour.fill = fillDimanche
  cDate.fill = fillDimanche
}
    // Jour sans missions → ligne vide avec bordures
   if (nb === 0) {
  for (let c = COL_DEBUT_O; c <= TOTAL_COLS; c++) {
    const cell = sheet.getCell(rowIdx, c)
    Object.assign(cell, styleData(true, true))
    if (estDimanche) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBA882' } }
    }
  }
  if (estDimanche) {
    cJour.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBA882' } }
    cDate.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBA882' } }
  }
  sheet.getRow(rowIdx).height = 22.5
  rowIdx++
  continue
}

    // Missions du jour
    for (let mIdx = 0; mIdx < nb; mIdx++) {
      const mission = fiche.missions[mIdx]
      const m       = mission as any
      const row     = rowIdx + mIdx
      const isFirst = mIdx === 0

      if (!isFirst) {
        sheet.getCell(row, 1).border = BORDER_THIN
        sheet.getCell(row, 2).border = BORDER_THIN
      }

      // Style toutes les cellules
      for (let c = COL_DEBUT_O; c <= COL_FIN_O; c++) Object.assign(sheet.getCell(row, c), styleData(isFirst, true))
      for (let c = COL_DEBUT_P; c <= COL_FIN_P; c++) Object.assign(sheet.getCell(row, c), styleData(isFirst, true))
      for (let c = COL_DEBUT_A; c <= COL_FIN_A; c++) Object.assign(sheet.getCell(row, c), styleData(isFirst, true))
      Object.assign(sheet.getCell(row, COL_PARTIE), styleData(isFirst, false))
      Object.assign(sheet.getCell(row, COL_CONF),   styleData(isFirst, true))
      Object.assign(sheet.getCell(row, COL_FICHE),  styleData(isFirst, true))
      Object.assign(sheet.getCell(row, COL_OBS),    styleData(isFirst, false))

      // Cocher la bonne colonne
      const typeM = m.typeOuvrage ?? mission.ouvrage.type
      const idxP  = getIdxPieux(typeM, m.nature)
      if (idxP !== null) {
        sheet.getCell(row, COL_DEBUT_P + idxP).value = 'X'
      } else {
        const idxO = getIdxOuvrage(typeM, mission.ouvrage.designation)
        if (idxO !== null) {
          sheet.getCell(row, COL_DEBUT_O + idxO).value = 'X'
        } else {
          const idxA = getIdxAssain(m.categorieAssainissement ?? null, typeM)
          if (idxA !== null) sheet.getCell(row, COL_DEBUT_A + idxA).value = 'X'
        }
      }

      // Partie d'Ouvrage
      sheet.getCell(row, COL_PARTIE).value = m.partieOuvrage
        ?? `${mission.ouvrage.reference} — ${mission.ouvrage.designation}`

      // CONFORME
      const estC = m.resultat === 'CONFORME' ||
        (mission.controles.length > 0 && mission.controles.every((c: any) => c.statut === 'CONFORME'))
      const estNC = m.resultat === 'NON_CONFORME' ||
        mission.controles.some((c: any) => c.statut === 'NON_CONFORME')

      if (estC) sheet.getCell(row, COL_CONF).value = 'X'
      sheet.getCell(row, COL_FICHE).value = m.ficheReference ?? ''

      let obs = mission.observations ?? ''
      if (estNC && !obs.toUpperCase().includes('NON CONFORME'))
        obs = obs ? `NON CONFORME — ${obs}` : 'NON CONFORME'
      sheet.getCell(row, COL_OBS).value = obs

      sheet.getRow(row).height = 22.5
      if (estDimanche) {
  const fillDimanche: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBA882' } }
  for (let c = 1; c <= TOTAL_COLS; c++) {
    sheet.getCell(row, c).fill = fillDimanche
  }
}
    }

    rowIdx += nbLignes
  }

  // Ligne TOTAL
  const lastDataRow = rowIdx - 1
  sheet.mergeCells(`A${rowIdx}:B${rowIdx}`)
  Object.assign(sheet.getCell(`A${rowIdx}`), {
    value: 'TOTAL', font: { bold: true, size: 10 },
    alignment: ALIGN_CENTER, border: BORDER_MEDIUM_TOP
  })
  const cL = colLetter(COL_CONF)
  Object.assign(sheet.getCell(`${cL}${rowIdx}`), {
    value: { formula: `COUNTIF(${cL}10:${cL}${lastDataRow},"X")` },
    font: { bold: true, size: 10 }, alignment: ALIGN_CENTER, border: BORDER_MEDIUM_TOP
  })
  sheet.getRow(rowIdx).height = 22.5
}

// ── USE-CASE PRINCIPAL ────────────────────────────────────────────
export async function exporterRapportExcelUseCase(brigadeId: string): Promise<Buffer> {

  const brigade = await prisma.brigade.findUnique({ where: { id: brigadeId } })
  if (!brigade) throw new NotFoundError('Brigade')

  // Sans filtre deletedAt — sera réintégré après sync du client Prisma
  const fiches = await prisma.ficheJournaliere.findMany({
    where: { brigadeId, statut: 'VALIDEE' },
    include: {
      missions: {
        include: { ouvrage: true, controles: { select: { statut: true } } },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { date: 'asc' }
  })

  // Grouper par mois — clé "AAAA-MM"
  const fichesPar = new Map<string, any[]>()
  for (const fiche of fiches) {
    const d   = new Date(fiche.date)
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
    if (!fichesPar.has(key)) fichesPar.set(key, [])
    fichesPar.get(key)!.push(fiche)
  }

  const workbook = new ExcelJS.Workbook()
  workbook.creator        = 'GeoGSC Monitoring — GEOCODING S.A.R.L'
  workbook.created        = new Date()
  workbook.modified       = new Date()
  workbook.lastModifiedBy = brigade.chef

  // Un onglet par mois dans l'ordre chronologique
  for (const [key, fichesMois] of fichesPar.entries()) {
    const [annee, moisIdx] = key.split('-').map(Number)
    const moisDate  = new Date(annee, moisIdx, 1)
    genererOngletMois(workbook, nomMoisFr(moisDate), brigade.chef, moisDate, fichesMois)
  }

  // Aucune fiche → onglet vide pour le mois courant
  if (fichesPar.size === 0) {
    genererOngletMois(workbook, nomMoisFr(new Date()), brigade.chef, new Date(), [])
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}