/**
 * @file RapportsPage.tsx
 * @description Page rapports & export — vue IGT/ADMIN.
 *
 * FONCTIONNALITÉS :
 * → Sélecteur brigade
 * → Export Excel CUMULATIF (un fichier par brigade, un onglet par mois)
 * → Statistiques mensuelles + graphique donut
 * → Liste ouvrages NON_CONFORMES
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { exportService } from '../../services/export.service'
import {
  Download, BarChart3, AlertTriangle, CheckCircle,
   FileText, Wrench, Calendar, FileSpreadsheet
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { PageLayout }      from '../../components/layout/PageLayout'
import { Card }            from '../../components/ui/Card'
import { Button }          from '../../components/ui/Button'
import { SpinnerPage }     from '../../components/ui/Spinner'
import { rapportsService } from '../../services/rapports.service'
import { fichesService }   from '../../services/fiches.service'
import { formatPeriode }   from '../../lib/utils'

// ── HELPER : mois courant au format YYYY-MM ────────────────────────
function getPeriodeCourante(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ── LISTE DES 12 DERNIERS MOIS ─────────────────────────────────────
function getDerniersMois(): { value: string; label: string }[] {
  const moisFr = ['Janvier','Février','Mars','Avril','Mai','Juin',
                  'Juillet','Août','Septembre','Octobre','Novembre','Décembre']
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${moisFr[d.getMonth()]} ${d.getFullYear()}`
    return { value, label }
  })
}

// ── COMPOSANT STAT KPI ─────────────────────────────────────────────
function StatItem({
  icon: Icon, label, value, color = 'text-[#0D3B66]', bg = 'bg-gray-50'
}: {
  icon: React.ElementType; label: string; value: string | number
  color?: string; bg?: string
}) {
  return (
    <div className={`flex items-center gap-3 p-3 ${bg} rounded-xl`}>
      <div className={`p-2 rounded-lg bg-white shadow-sm ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <div className={`text-xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

// ── PAGE PRINCIPALE ────────────────────────────────────────────────
export function RapportsPage() {
  const [exportLoading, setExportLoading] = useState(false)
  const [brigadeId,     setBrigadeId]     = useState('')
  const [periode,       setPeriode]       = useState(getPeriodeCourante())

  const mois = getDerniersMois()

  // ── Export Excel cumulatif ────────────────────────────────────
  const handleExport = async () => {
    if (!brigadeId) {
      toast.error('Sélectionnez une brigade')
      return
    }
    setExportLoading(true)
    try {
      const brigade = brigades.find(b => b.id === brigadeId)
      await exportService.telechargerRapport(brigadeId, brigade?.nom ?? 'Brigade')
      toast.success('Rapport complet téléchargé ✓')
    } catch {
      toast.error("Erreur lors de l'export Excel")
    } finally {
      setExportLoading(false)
    }
  }

  // ── Brigades depuis les fiches ────────────────────────────────
  const { data: fichesData } = useQuery({
    queryKey: ['fiches', undefined, 1],
    queryFn:  () => fichesService.getAll({ limit: 100 })
  })

  const brigades = fichesData?.data
    ? Array.from(
        fichesData.data.reduce((map, fiche) => {
          if (!map.has(fiche.brigadeId)) map.set(fiche.brigadeId, fiche.brigade)
          return map
        }, new Map<string, { id: string; nom: string; chef: string }>()).values()
      )
    : []

  // ── Rapport mensuel ───────────────────────────────────────────
  const { data: rapport, isLoading, isError } = useQuery({
    queryKey: ['rapport', brigadeId, periode],
    queryFn:  () => rapportsService.getRapport(brigadeId, periode),
    enabled:  !!brigadeId
  })

  const pieData = rapport ? [
    { name: 'Conformes',     value: rapport.nbConformes,    color: '#00897B' },
    { name: 'Réserves',      value: rapport.nbReserves,     color: '#D97706' },
    { name: 'Non conformes', value: rapport.nbNonConformes, color: '#DC2626' }
  ].filter(d => d.value > 0) : []

  const brigadeSelectionnee = brigades.find(b => b.id === brigadeId)

  return (
    <PageLayout title="Rapports & Export">
      <div className="space-y-4">

        {/* ── CARTE SÉLECTION + EXPORT ───────────────────────── */}
        <Card>
          <Card.Body>

            {/* Sélecteur Brigade */}
            <div className="flex flex-col gap-1.5 mb-3">
              <label className="text-sm font-medium text-gray-700">Brigade</label>
              <select
                value={brigadeId}
                onChange={(e) => setBrigadeId(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 text-sm bg-white focus:outline-none focus:border-[#1B6B93] focus:ring-2 focus:ring-[#D9EAF5]"
              >
                <option value="">Sélectionner une brigade...</option>
                {brigades.map((b) => (
                  <option key={b.id} value={b.id}>{b.nom} — {b.chef}</option>
                ))}
              </select>
            </div>

            {/* Sélecteur Mois (pour les stats uniquement) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Mois pour les statistiques
              </label>
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 text-sm bg-white focus:outline-none focus:border-[#1B6B93] focus:ring-2 focus:ring-[#D9EAF5]"
              >
                {mois.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Bloc Export Excel */}
            {brigadeId && (
              <div className="mt-4 pt-4 border-t border-gray-100">

                {/* Info export */}
                <div className="flex items-start gap-3 p-3 bg-[#D9EAF5] rounded-xl mb-3">
                  <div className="p-2 bg-[#0D3B66] rounded-lg flex-shrink-0">
                    <FileSpreadsheet size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0D3B66]">
                      Rapport complet — {brigadeSelectionnee?.nom}
                    </div>
                    <div className="text-xs text-[#1B6B93] mt-0.5">
                      Un fichier Excel avec un onglet par mois depuis le début du projet.
                      Toutes les missions, colonnes Ouvrage + Pieux + Assainissement.
                    </div>
                  </div>
                </div>

                <Button
                  variant="success"
                  size="md"
                  loading={exportLoading}
                  onClick={handleExport}
                  className="w-full"
                >
                  <Download size={16} />
                  {exportLoading ? 'Génération en cours...' : 'Télécharger le rapport Excel complet'}
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* ── ÉTAT VIDE ─────────────────────────────────────── */}
        {!brigadeId && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#D9EAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={28} className="text-[#0D3B66]" />
            </div>
            <h3 className="text-gray-600 font-medium mb-1">Sélectionnez une brigade</h3>
            <p className="text-gray-400 text-sm">
              Choisissez une brigade pour afficher les statistiques et exporter le rapport
            </p>
          </div>
        )}

        {/* ── CHARGEMENT ────────────────────────────────────── */}
        {brigadeId && isLoading && (
          <div className="flex justify-center py-12"><SpinnerPage /></div>
        )}

        {/* ── ERREUR / PAS DE DONNÉES ───────────────────────── */}
        {brigadeId && isError && (
          <div className="flex flex-col items-center py-8 gap-2">
            <Calendar size={32} className="text-gray-300" />
            <p className="text-gray-500 text-sm">Aucune donnée pour ce mois</p>
          </div>
        )}

        {/* ── RAPPORT MENSUEL ───────────────────────────────── */}
        {rapport && (
          <div className="space-y-4">

            {/* En-tête rapport */}
            <div className="p-4 bg-[#0D3B66] rounded-2xl text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-blue-200 mb-1 font-medium tracking-wide uppercase">
                    GEOCODING × ANEP — Marché 05/2025/ANEP
                  </div>
                  <h2 className="text-lg font-bold">
                    Synthèse {formatPeriode(rapport.periode)}
                  </h2>
                  <p className="text-blue-200 text-sm mt-0.5">
                    {rapport.brigade.nom} — {rapport.brigade.chef}
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0"
                >
                  <Download size={20} className="text-white" />
                </button>
              </div>

              {/* Taux de conformité en barre */}
              {rapport.nbControles > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-blue-200 mb-1">
                    <span>Taux de conformité</span>
                    <span className="font-bold text-white">{rapport.tauxConformite}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${rapport.tauxConformite}%`,
                        backgroundColor: rapport.tauxConformite >= 80 ? '#00897B' : rapport.tauxConformite >= 60 ? '#D97706' : '#DC2626'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <StatItem icon={FileText}    label="Fiches validées" value={rapport.nbFichesValidees} color="text-[#0D3B66]" />
              <StatItem icon={Wrench}      label="Missions"        value={rapport.nbMissions}        color="text-[#1B6B93]" />
              <StatItem
                icon={CheckCircle}
                label="Conformes"
                value={rapport.nbConformes}
                color="text-[#00897B]"
                bg="bg-teal-50"
              />
              <StatItem
                icon={AlertTriangle}
                label="Non conformes"
                value={rapport.nbNonConformes}
                color={rapport.nbNonConformes > 0 ? 'text-red-600' : 'text-gray-400'}
                bg={rapport.nbNonConformes > 0 ? 'bg-red-50' : 'bg-gray-50'}
              />
            </div>

            {/* Graphique donut + détail */}
            {rapport.nbControles > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <Card.Header>Répartition contrôles</Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={75}
                          paddingAngle={3} dataKey="value"
                        >
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip
                          formatter={(v: any) => `${v ?? 0} contrôles`}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <Legend
                          iconType="circle" iconSize={8}
                          formatter={(v) => <span style={{ fontSize: '12px', color: '#6B7280' }}>{v}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>

                <Card>
                  <Card.Header>Détail</Card.Header>
                  <Card.Body className="space-y-3">
                    {[
                      { label: 'Conformes',     value: rapport.nbConformes,    color: 'text-[#00897B]',  bg: 'bg-teal-50'   },
                      { label: 'Réserves',      value: rapport.nbReserves,     color: 'text-orange-600', bg: 'bg-orange-50' },
                      { label: 'Non conformes', value: rapport.nbNonConformes, color: 'text-red-600',    bg: 'bg-red-50'    }
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className={`flex items-center justify-between p-3 ${bg} rounded-xl`}>
                        <span className={`text-sm font-medium ${color}`}>{label}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${color}`}>{value}</span>
                          <span className={`text-xs ${color} opacity-70`}>
                            {Math.round((value / rapport.nbControles) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </div>
            )}

            {/* Ouvrages NC */}
            {rapport.ouvragesNonConformes.length > 0 && (
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-600" />
                    <span>Ouvrages non conformes ({rapport.ouvragesNonConformes.length})</span>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="divide-y divide-gray-50">
                    {rapport.ouvragesNonConformes.map((ouvrage, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-red-600">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900">{ouvrage.reference}</div>
                          <div className="text-xs text-gray-500 truncate">{ouvrage.designation}</div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-sm font-bold text-red-600">{ouvrage.nbNonConformes}</div>
                          <div className="text-xs text-gray-400">NC</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  )
}