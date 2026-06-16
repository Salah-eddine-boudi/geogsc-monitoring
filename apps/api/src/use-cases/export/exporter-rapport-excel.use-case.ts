/**
 * @file exporter-rapport-excel.use-case.ts
 * @description Génère le rapport Excel HEBDOMADAIRE au format exact GEOCODING.
 *
 * EXPORT PAR SEMAINE ISO :
 * → Semaine ISO : commence le Lundi, finit le Dimanche
 * → ex: Semaine 23/2026 = Lundi 1er juin → Dimanche 7 juin 2026
 *
 * STRUCTURE : 33 colonnes (A→AG)
 * A-B    = Jour / Date (fusionnés par jour, bordure medium en haut)
 * C→Q    = 15 types d'ouvrages
 * R→AC   = 12 colonnes ASSAINISSEMENT
 * AD     = Partie d'Ouvrage
 * AE     = CONFORME
 * AF     = Fiche
 * AG     = Observations
 */

import ExcelJS from 'exceljs'
import { prisma } from '../../infrastructure/prisma/prisma.js'
import { NotFoundError } from '../../domain/errors.js'

// ── COLONNES ──────────────────────────────────────────────────────

const COLS_OUVRAGES = [
  'Poteau AV bétonnage',              // C  col3
  'Poteau AP bétonnage',              // D  col4
  'Poutre crémaillère AV bétonnage',  // E  col5
  'Poutre crémaillère AP bétonnage',  // F  col6
  'Gradins',                           // G  col7
  'Voile AV bétonnage',               // H  col8
  'Voile AP bétonnage',               // I  col9
  'Chambord',                          // J  col10
  'Vomitoire',                         // K  col11
  'Semelle filante',                   // L  col12
  'Semelle isoleé',                    // M  col13
  'Dalles',                            // N  col14
  'Mur de soutènment',                // O  col15
  'terrassement',                      // P  col16
  'Autre',                             // Q  col17
] as const

const COLS_ASSAIN = [
  'Implantation general',              // R  col18
  'FOND DE FOUILLE',                   // S  col19
  "FIL D'EAU",                         // T  col20
  'Lit Pose',                          // U  col21
  'coffrage des voiles du regard',     // V  col22
  'Voile du regard AP bétonnage',      // W  col23
  'coffrage RADIER',                   // X  col24
  'COTE RADIER',                       // Y  col25
  'coffrage du dalle',                 // Z  col26
  'Dalle AP bétonnage',                // AA col27
  'coffrage Gros béton',               // AB col28
  'Gros béton AP bétonnage',           // AC col29
] as const

const COL_DEBUT_OUVRAGE = 3
const COL_FIN_OUVRAGE   = 17
const COL_DEBUT_ASSAIN  = 18
const COL_FIN_ASSAIN    = 29
const COL_PARTIE        = 30  // AD
const COL_CONFORME      = 31  // AE
const COL_FICHE         = 32  // AF
const COL_OBSERVATIONS  = 33  // AG
const TOTAL_COLS        = 33

// ── HELPERS ───────────────────────────────────────────────────────

function colLetter(n: number): string {
  if (n <= 26) return String.fromCharCode(64 + n)
  return String.fromCharCode(64 + Math.floor((n - 1) / 26)) +
         String.fromCharCode(64 + ((n - 1) % 26) + 1)
}

function getJourSemaine(date: Date): string {
  return ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][date.getDay()]
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Calcule les dates de début (Lundi) et fin (Dimanche) d'une semaine ISO.
 *
 * Semaine ISO 8601 :
 * - Commence le Lundi
 * - Semaine 1 = semaine contenant le premier Jeudi de l'année
 *
 * Algorithme :
 * 1. Trouver le 4 Janvier (toujours en semaine 1)
 * 2. Trouver le Lundi de la semaine 1
 * 3. Ajouter (semaine - 1) * 7 jours
 */
export function getDatesFromSemaine(annee: number, semaine: number): {
  debut: Date
  fin: Date
  label: string
} {
  // Jeudi de la semaine demandée (ISO : le Jeudi est toujours dans la bonne semaine)
  const jan4 = new Date(annee, 0, 4)
  const jourSemaine = jan4.getDay() || 7 // 1=Lundi ... 7=Dimanche
  const lundi1 = new Date(jan4)
  lundi1.setDate(jan4.getDate() - jourSemaine + 1)

  const debut = new Date(lundi1)
  debut.setDate(lundi1.getDate() + (semaine - 1) * 7)
  debut.setHours(0, 0, 0, 0)

  const fin = new Date(debut)
  fin.setDate(debut.getDate() + 6)
  fin.setHours(23, 59, 59, 999)

  const label = `Semaine ${semaine} — du ${formatDate(debut)} au ${formatDate(fin)}`

  return { debut, fin, label }
}

function getIndexOuvrage(
  typeOuvrageMission: string | null,
  typeOuvrageRef: string,
  designation: string
): number | null {
  const type = typeOuvrageMission ?? typeOuvrageRef
  const MAP: Record<string, number | null> = {
    POTEAU_AV_BETONNAGE:             0,
    POTEAU_AP_BETONNAGE:             1,
    POTEAU:                          0,
    PLATINE:                         0,
    POUTRE_CREMAILLERE_AV_BETONNAGE: 2,
    POUTRE_CREMAILLERE_AP_BETONNAGE: 3,
    GRADIN:                          4,
    VOILE_AV_BETONNAGE:              5,
    VOILE_AP_BETONNAGE:              6,
    VOILE:                           5,
    CHAMBORD:                        7,
    VOMITOIRE:                       8,
    SEMELLE_FILANTE:                 9,
    SEMELLE_ISOLEE:                  10,
    DALLES:                          11,
    MUR_SOUTENEMENT:                 12,
    TERRASSEMENT:                    13,
    VRD:                             13,
    FONDATION:                       13,
    ASSAINISSEMENT:                  null,
    AUTRE:                           14,
  }
  if (type in MAP) return MAP[type]
  const label = designation.toLowerCase()
  if (label.includes('poteau'))        return 0
  if (label.includes('crémaillère') || label.includes('cremaillere'))
    return label.includes('ap') ? 3 : 2
  if (label.includes('gradin'))        return 4
  if (label.includes('voile'))         return 5
  if (label.includes('chambord'))      return 7
  if (label.includes('vomitoire'))     return 8
  if (label.includes('semelle'))       return 9
  if (label.includes('dalle'))         return 11
  if (label.includes('mur'))           return 12
  if (label.includes('assainis') || label.includes('fouille') || label.includes('radier'))
    return null
  return 14
}

function getIndexAssain(
  categorieAssainissement: string | null,
  typeOuvrageMission: string | null,
  typeOuvrageRef: string
): number | null {
  if (categorieAssainissement) {
    const MAP: Record<string, number> = {
      IMPLANTATION_GENERAL:      0,
      FOND_DE_FOUILLE:           1,
      FIL_EAU:                   2,
      LIT_POSE:                  3,
      COFFRAGE_VOILES_REGARD:    4,
      VOILE_REGARD_AP_BETONNAGE: 5,
      COFFRAGE_RADIER:           6,
      COTE_RADIER:               7,
      COFFRAGE_DALLE:            8,
      COFFRAGE_GROS_BETON:       10,
      GROS_BETON_AP_BETONNAGE:   11,
    }
    if (MAP[categorieAssainissement] !== undefined) return MAP[categorieAssainissement]
  }
  const type = typeOuvrageMission ?? typeOuvrageRef
  if (type === 'ASSAINISSEMENT') return 1
  return null
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

// ── USE-CASE PRINCIPAL ────────────────────────────────────────────

export async function exporterRapportExcelUseCase(
  brigadeId: string,
  annee: number,
  semaine: number
): Promise<Buffer> {

  const brigade = await prisma.brigade.findUnique({ where: { id: brigadeId } })
  if (!brigade) throw new NotFoundError('Brigade')

  const { debut, fin, label } = getDatesFromSemaine(annee, semaine)

  const fiches = await prisma.ficheJournaliere.findMany({
    where: {
      brigadeId,
      statut: 'VALIDEE',
      date:   { gte: debut, lte: fin }
    },
    include: {
      missions: {
        include: { ouvrage: true, controles: { select: { statut: true } } },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { date: 'asc' }
  })

  // ── Workbook ──────────────────────────────────────────────────
  const workbook = new ExcelJS.Workbook()
  workbook.creator  = 'GeoGSC Monitoring — GEOCODING S.A.R.L'
  workbook.created  = new Date()
  workbook.modified = new Date()

  const nomOnglet = `S${semaine} — ${formatDate(debut).slice(0,5)} au ${formatDate(fin).slice(0,5)}`

  const sheet = workbook.addWorksheet(nomOnglet, {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  })

  // ── Largeurs colonnes ─────────────────────────────────────────
  const largeurs: Record<number, number> = {
    1: 9, 2: 10.5,
    3: 10, 4: 10.4, 5: 13.6, 6: 13.5, 7: 8.4,
    8: 10.1, 9: 9.9, 10: 11.5, 11: 10.6,
    12: 9.7, 13: 9.7, 14: 8.3, 15: 13.0, 16: 14.1, 17: 9.3,
    18: 13, 19: 11, 20: 10.5, 21: 10.8, 22: 14, 23: 14,
    24: 12, 25: 10.8, 26: 12, 27: 12, 28: 12, 29: 14,
    30: 32.9, 31: 12.2, 32: 9.3, 33: 14.7,
  }
  for (let c = 1; c <= TOTAL_COLS; c++) {
    sheet.getColumn(c).width = largeurs[c] ?? 10
  }

  sheet.getRow(8).height = 28.5
  sheet.getRow(9).height = 54.0

  const lastColLetter = colLetter(TOTAL_COLS)

  // ── LIGNE 1-2 : Titre ─────────────────────────────────────────
  sheet.mergeCells(`A1:${lastColLetter}2`)
  const cellTitre = sheet.getCell('A1')
  cellTitre.value     = 'RAPPORT JOURNALIER DU CONTRÔLE TOPOGRAPHIQUE DU GRAND STADE DE CASABLANCA'
  cellTitre.font      = { bold: false, size: 18, color: { argb: 'FFBFCED0' } }
  cellTitre.alignment = { horizontal: 'center', vertical: 'middle' }

  // ── LIGNE 4 : Nom ─────────────────────────────────────────────
  sheet.getCell('A4').value = 'Nom complet :'
  sheet.getCell('A4').font  = { size: 11 }
  sheet.mergeCells('B4:C4')
  sheet.getCell('B4').value = ` ${brigade.chef}`
  sheet.getCell('B4').font  = { size: 10 }

  // ── LIGNE 6 : Semaine ─────────────────────────────────────────
  sheet.getCell('A6').value = 'Période :'
  sheet.getCell('A6').font  = { size: 9 }
  sheet.mergeCells('B6:F6')
  sheet.getCell('B6').value = label   // "Semaine 23 — du 01/06/2026 au 07/06/2026"
  sheet.getCell('B6').font  = { size: 9 }

  // ── LIGNE 8 : En-têtes niveau 1 ───────────────────────────────
  sheet.mergeCells('A8:A9')
  Object.assign(sheet.getCell('A8'), { ...styleEntete1(10), value: 'Jour' })

  sheet.mergeCells('B8:B9')
  Object.assign(sheet.getCell('B8'), { ...styleEntete1(10), value: 'Date' })

  sheet.mergeCells(`${colLetter(COL_DEBUT_OUVRAGE)}8:${colLetter(COL_FIN_OUVRAGE)}8`)
  Object.assign(sheet.getCell(`${colLetter(COL_DEBUT_OUVRAGE)}8`), { ...styleEntete1(12), value: 'Ouvrage' })

  sheet.mergeCells(`${colLetter(COL_DEBUT_ASSAIN)}8:${colLetter(COL_FIN_ASSAIN)}8`)
  Object.assign(sheet.getCell(`${colLetter(COL_DEBUT_ASSAIN)}8`), { ...styleEntete1(12), value: 'ASSAINISSEMENT' })

  sheet.mergeCells(`${colLetter(COL_PARTIE)}8:${colLetter(COL_PARTIE)}9`)
  Object.assign(sheet.getCell(`${colLetter(COL_PARTIE)}8`), { ...styleEntete1(11), value: "Partie d'Ouvrage" })

  sheet.mergeCells(`${colLetter(COL_CONFORME)}8:${colLetter(COL_CONFORME)}9`)
  Object.assign(sheet.getCell(`${colLetter(COL_CONFORME)}8`), { ...styleEntete1(11), value: 'CONFORME' })

  sheet.mergeCells(`${colLetter(COL_FICHE)}8:${colLetter(COL_FICHE)}9`)
  Object.assign(sheet.getCell(`${colLetter(COL_FICHE)}8`), { ...styleEntete1(11), value: 'Fiche' })

  sheet.mergeCells(`${colLetter(COL_OBSERVATIONS)}8:${colLetter(COL_OBSERVATIONS)}9`)
  Object.assign(sheet.getCell(`${colLetter(COL_OBSERVATIONS)}8`), { ...styleEntete1(11), value: 'Observations' })

  // ── LIGNE 9 : Sous-en-têtes ───────────────────────────────────
  COLS_OUVRAGES.forEach((label, i) => {
    Object.assign(sheet.getCell(9, COL_DEBUT_OUVRAGE + i), { ...STYLE_ENTETE2, value: label })
  })
  COLS_ASSAIN.forEach((label, i) => {
    Object.assign(sheet.getCell(9, COL_DEBUT_ASSAIN + i), { ...STYLE_ENTETE2, value: label })
  })

  // ── DONNÉES ───────────────────────────────────────────────────
  let rowIdx = 10

  for (const fiche of fiches) {
    const dateFiche  = new Date(fiche.date)
    const nbMissions = fiche.missions.length
    if (nbMissions === 0) continue

    if (nbMissions > 1) {
      sheet.mergeCells(rowIdx, 1, rowIdx + nbMissions - 1, 1)
      sheet.mergeCells(rowIdx, 2, rowIdx + nbMissions - 1, 2)
    }

    const cellJour = sheet.getCell(rowIdx, 1)
    cellJour.value = getJourSemaine(dateFiche)
    cellJour.font  = { bold: true, size: 9 }
    cellJour.alignment = ALIGN_CENTER
    cellJour.border    = BORDER_MEDIUM_TOP

    const cellDate = sheet.getCell(rowIdx, 2)
    cellDate.value  = dateFiche
    cellDate.numFmt = 'DD/MM/YYYY'
    cellDate.font   = { bold: true, size: 9 }
    cellDate.alignment = ALIGN_CENTER
    cellDate.border    = BORDER_MEDIUM_TOP

    for (let mIdx = 0; mIdx < nbMissions; mIdx++) {
      const mission = fiche.missions[mIdx]
      const m       = mission as any
      const row     = rowIdx + mIdx
      const isFirst = mIdx === 0

      if (!isFirst) {
        sheet.getCell(row, 1).border = BORDER_THIN
        sheet.getCell(row, 2).border = BORDER_THIN
      }

      // Style toute la ligne
      for (let c = COL_DEBUT_OUVRAGE; c <= COL_FIN_OUVRAGE; c++)
        Object.assign(sheet.getCell(row, c), styleData(isFirst, true))
      for (let c = COL_DEBUT_ASSAIN; c <= COL_FIN_ASSAIN; c++)
        Object.assign(sheet.getCell(row, c), styleData(isFirst, true))
      Object.assign(sheet.getCell(row, COL_PARTIE),      styleData(isFirst, false))
      Object.assign(sheet.getCell(row, COL_CONFORME),    styleData(isFirst, true))
      Object.assign(sheet.getCell(row, COL_FICHE),       styleData(isFirst, true))
      Object.assign(sheet.getCell(row, COL_OBSERVATIONS),styleData(isFirst, false))

      // Cocher la colonne ouvrage
      const idxOuvrage = getIndexOuvrage(m.typeOuvrage ?? null, mission.ouvrage.type, mission.ouvrage.designation)
      const idxAssain  = idxOuvrage === null
        ? getIndexAssain(m.categorieAssainissement ?? null, m.typeOuvrage ?? null, mission.ouvrage.type)
        : null

      if (idxOuvrage !== null)
        sheet.getCell(row, COL_DEBUT_OUVRAGE + idxOuvrage).value = 'X'
      if (idxAssain !== null)
        sheet.getCell(row, COL_DEBUT_ASSAIN + idxAssain).value = 'X'

      // Partie d'Ouvrage
      sheet.getCell(row, COL_PARTIE).value = m.partieOuvrage
        ?? `${mission.ouvrage.reference} — ${mission.ouvrage.designation}`

      // CONFORME
      const estConforme = m.resultat === 'CONFORME' ||
        (mission.controles.length > 0 && mission.controles.every((c: any) => c.statut === 'CONFORME'))
      const estNonConforme = m.resultat === 'NON_CONFORME' ||
        mission.controles.some((c: any) => c.statut === 'NON_CONFORME')

      if (estConforme) sheet.getCell(row, COL_CONFORME).value = 'X'

      // Fiche référence
      sheet.getCell(row, COL_FICHE).value = m.ficheReference ?? ''

      // Observations
      let obsVal = mission.observations ?? ''
      if (estNonConforme && !obsVal.toUpperCase().includes('NON CONFORME'))
        obsVal = obsVal ? `NON CONFORME — ${obsVal}` : 'NON CONFORME'
      sheet.getCell(row, COL_OBSERVATIONS).value = obsVal

      sheet.getRow(row).height = 22.5
    }

    rowIdx += nbMissions
  }

  // ── LIGNE TOTAL ───────────────────────────────────────────────
  const lastDataRow    = rowIdx - 1
  const colConfLetter  = colLetter(COL_CONFORME)
  const colFicheLetter = colLetter(COL_FICHE)

  sheet.mergeCells(`A${rowIdx}:B${rowIdx}`)
  Object.assign(sheet.getCell(`A${rowIdx}`), {
    value: 'TOTAL', font: { bold: true, size: 10 },
    alignment: ALIGN_CENTER, border: BORDER_MEDIUM_TOP
  })

  Object.assign(sheet.getCell(`${colConfLetter}${rowIdx}`), {
    value: { formula: `COUNTIF(${colConfLetter}10:${colConfLetter}${lastDataRow},"X")` },
    font: { bold: true, size: 10 }, alignment: ALIGN_CENTER, border: BORDER_MEDIUM_TOP
  })

  Object.assign(sheet.getCell(`${colFicheLetter}${rowIdx}`), {
    value: { formula: `COUNTA(${colFicheLetter}10:${colFicheLetter}${lastDataRow})` },
    font: { bold: true, size: 10 }, alignment: ALIGN_CENTER, border: BORDER_MEDIUM_TOP
  })

  sheet.getRow(rowIdx).height = 22.5

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}