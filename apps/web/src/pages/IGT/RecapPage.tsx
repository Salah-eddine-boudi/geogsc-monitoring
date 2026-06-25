/**
 * @file RecapPage.tsx
 * @description M9 — Récapitulatif mensuel.
 * Reproduit le format exact des fichiers Excel ANEP.
 * Généré automatiquement depuis les fiches journalières — aucune saisie manuelle.
 *
 * ROUTES : /recap
 * ACCÈS  : IGT, ADMIN
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet, FileText, Info } from 'lucide-react'
import { PageLayout }   from '../../components/layout/PageLayout'
import { Card }         from '../../components/ui/Card'
import { Button }       from '../../components/ui/Button'
import { SpinnerPage }  from '../../components/ui/Spinner'
import api from '../../services/api'

// ─── HELPERS ──────────────────────────────────────────────────────

function getCurrentPeriode() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getDerniersMois(n = 12) {
  const mois = []
  const now  = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    mois.push({
      value,
      label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    })
  }
  return mois
}

function formatJour(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { weekday: 'short' })
    .replace(/^\w/, c => c.toUpperCase())
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── SERVICE ──────────────────────────────────────────────────────

interface LigneRecap {
  id:            string
  date:          string
  brigadeNom:    string
  typeOuvrage:   string | null
  partieOuvrage: string | null
  conforme:      boolean | null
  reference:     string | null
  observations:  string | null
  ficheId:       string
}

async function getRecap(periode: string, brigadeId?: string): Promise<LigneRecap[]> {
  const params: Record<string, string> = { periode }
  if (brigadeId) params.brigadeId = brigadeId

  const { data } = await api.get('/fiches', {
    params: { ...params, statut: 'VALIDEE', limit: 200 }
  })

  // Aplatir les missions depuis les fiches
  const lignes: LigneRecap[] = []
  for (const fiche of (data.data ?? [])) {
    for (const mission of (fiche.missions ?? [])) {
      lignes.push({
        id:            mission.id,
        date:          fiche.date,
        brigadeNom:    fiche.brigade?.nom ?? '',
        typeOuvrage:   mission.typeOuvrage ?? mission.ouvrage?.type ?? null,
        partieOuvrage: mission.partieOuvrage ?? null,
        conforme:      mission.resultat === 'CONFORME' ? true
                       : mission.resultat === 'NON_CONFORME' ? false : null,
        reference:     mission.ficheReference ?? null,
        observations:  mission.observations ?? null,
        ficheId:       fiche.id,
      })
    }
  }
  return lignes.sort((a, b) => a.date.localeCompare(b.date))
}

function formatTypeOuvrage(type: string | null): string {
  if (!type) return '—'
  const map: Record<string, string> = {
    POUTRE_CREMAILLERE_AV_BETONNAGE: 'Crémaillère AV',
    POUTRE_CREMAILLERE_AP_BETONNAGE: 'Crémaillère AP',
    POTEAU_AV_BETONNAGE: 'Poteau AV',
    POTEAU_AP_BETONNAGE: 'Poteau AP',
    VOILE_AV_BETONNAGE: 'Voile AV',
    VOILE_AP_BETONNAGE: 'Voile AP',
    SEMELLE_FILANTE: 'Sem. filante',
    SEMELLE_ISOLEE:  'Sem. isolée',
    MUR_SOUTENEMENT: 'Mur sout.',
    ASSAINISSEMENT:  'Assainist.',
    GRADIN: 'Gradin',
    DALLES: 'Dalles',
    PLATINE: 'Platine',
    POTEAU: 'Poteau',
    VOILE: 'Voile',
    FONDATION: 'Fondation',
    TERRASSEMENT: 'Terrassement',
    VRD: 'VRD',
    AUTRE: 'Autre',
  }
  return map[type] ?? type.replace(/_/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase())
}

// ─── PAGE ─────────────────────────────────────────────────────────

export function RecapPage() {
  const [periode, setPeriode]     = useState(getCurrentPeriode())
  const [brigadeId, setBrigadeId] = useState<string | undefined>()
  const mois = getDerniersMois(12)

  const { data: lignes = [], isLoading } = useQuery({
    queryKey: ['recap', periode, brigadeId],
    queryFn:  () => getRecap(periode, brigadeId),
  })

  const { data: brigadesData } = useQuery({
    queryKey: ['brigades-list'],
    queryFn:  async () => {
      const { data } = await api.get('/brigades')
      return data.brigades ?? data.data ?? []
    },
  })

  const conformes    = lignes.filter(l => l.conforme === true).length
  const nonConformes = lignes.filter(l => l.conforme === false).length

  const handleExportExcel = () => {
    const params = new URLSearchParams({ periode })
    if (brigadeId) params.set('brigadeId', brigadeId)
    window.open(`/api/export/recap?${params.toString()}`, '_blank')
  }

  const handleExportPDF = () => {
    window.print()
  }

  if (isLoading) return <SpinnerPage />

  return (
    <PageLayout
      title="Récapitulatif mensuel"
      action={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportExcel}>
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Export Excel</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportPDF}>
            <Download size={16} />
            <span className="hidden sm:inline">Export PDF A3</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">

        {/* ── FILTRES ── */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={periode}
            onChange={e => setPeriode(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B6B93]"
          >
            {mois.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {brigadesData && brigadesData.length > 0 && (
            <select
              value={brigadeId ?? ''}
              onChange={e => setBrigadeId(e.target.value || undefined)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B6B93]"
            >
              <option value="">Toutes les brigades</option>
              {brigadesData.map((b: any) => (
                <option key={b.id} value={b.id}>{b.nom}</option>
              ))}
            </select>
          )}

          <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
            <span>{lignes.length} ligne{lignes.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span className="text-[#00897B] font-medium">{conformes} conformes</span>
            <span>·</span>
            <span className="text-red-600 font-medium">{nonConformes} NC</span>
          </div>
        </div>

        {/* ── BANDEAU INFO ── */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#D9EAF5] border border-[#1B6B93]/20 rounded-xl">
          <Info size={16} className="text-[#1B6B93] flex-shrink-0" />
          <p className="text-sm text-[#0D3B66]">
            Reproduction exacte du format Excel ANEP — consolidé automatiquement depuis les fiches journalières, aucune ressaisie.
          </p>
        </div>

        {/* ── TABLEAU ── */}
        <Card>
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-[#0D3B66]">
              Stade GSC — Contrôle topographique · {mois.find(m => m.value === periode)?.label}
            </h2>
          </div>

          {lignes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText size={32} className="mb-3 text-gray-200" />
              <p className="text-sm">Aucune réception validée pour cette période</p>
              <p className="text-xs mt-1 text-gray-300">Seules les fiches validées apparaissent ici</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="px-3 py-3 text-left font-semibold w-12">Jour</th>
                    <th className="px-3 py-3 text-left font-semibold w-16">Date</th>
                    <th className="px-3 py-3 text-left font-semibold">Brigade</th>
                    <th className="px-3 py-3 text-left font-semibold">Type d'ouvrage</th>
                    <th className="px-3 py-3 text-left font-semibold">Partie d'ouvrage</th>
                    <th className="px-3 py-3 text-center font-semibold w-24">Conforme</th>
                    <th className="px-3 py-3 text-left font-semibold w-28">N° Fiche</th>
                    <th className="px-3 py-3 text-left font-semibold">Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lignes.map((ligne) => (
                    <tr
                      key={ligne.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        ligne.conforme === false ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-gray-400 text-xs font-medium">
                        {formatJour(ligne.date)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 font-mono text-xs">
                        {formatDate(ligne.date)}
                      </td>
                      <td className="px-3 py-2.5 text-[#1B6B93] font-medium text-xs">
                        {ligne.brigadeNom}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">
                        {formatTypeOuvrage(ligne.typeOuvrage)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 max-w-xs truncate">
                        {ligne.partieOuvrage ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {ligne.conforme === null ? (
                          <span className="text-gray-300">—</span>
                        ) : ligne.conforme ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-100">
                            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                            <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[#1B6B93] font-mono text-xs">
                        {ligne.reference ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs max-w-xs truncate">
                        {ligne.conforme === false && ligne.observations
                          ? <span className="text-red-600">{ligne.observations}</span>
                          : (ligne.observations ?? '—')
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={4} className="px-3 py-2.5 text-xs font-semibold text-gray-600">
                      Total : {lignes.length} réception{lignes.length !== 1 ? 's' : ''}
                    </td>
                    <td colSpan={4} className="px-3 py-2.5 text-xs">
                      <span className="text-[#00897B] font-semibold">{conformes} conformes</span>
                      <span className="text-gray-300 mx-2">·</span>
                      <span className="text-red-600 font-semibold">{nonConformes} non conformes</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

      </div>
    </PageLayout>
  )
}