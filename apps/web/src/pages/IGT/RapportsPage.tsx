/**
 * @file RapportsPage.tsx
 * @description Page rapports mensuels — vue IGT/ADMIN.
 *
 * FONCTIONNALITÉS :
 * → Sélecteur brigade + période (YYYY-MM)
 * → Affichage statistiques : nb fiches, missions, contrôles, taux conformité
 * → Graphique donut conformité
 * → Liste ouvrages NON_CONFORMES triés par nb décroissant
 *
 * FLUX :
 * 1. IGT sélectionne une brigade et une période
 * 2. React Query fetch GET /rapports/:brigadeId/:periode
 * 3. Affichage des statistiques calculées côté serveur
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { exportService } from '../../services/export.service'
import { Download } from 'lucide-react'
import {
  PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  BarChart3, AlertTriangle, CheckCircle,
  TrendingUp, FileText, Wrench
} from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { SpinnerPage } from '../../components/ui/Spinner'
import { rapportsService } from '../../services/rapports.service'
import { fichesService } from '../../services/fiches.service'
import { getPeriodeCourante, formatPeriode } from '../../lib/utils'

// ─── COMPOSANT STAT ───────────────────────────────────────────────

/**
 * StatItem — affiche une statistique dans le rapport.
 */
function StatItem({
  icon: Icon,
  label,
  value,
  color = 'text-[#0D3B66]'
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color?: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
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

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────

export function RapportsPage() {
  const [exportLoading, setExportLoading] = useState(false)

  /**
   * État du sélecteur.
   * brigadeId → brigade sélectionnée
   * periode   → mois sélectionné au format YYYY-MM
   */
  const [brigadeId, setBrigadeId] = useState('')
  const [periode, setPeriode] = useState(getPeriodeCourante())

  /**
   * Télécharge le rapport au format Excel.
   */
  const handleExport = async () => {
    if (!brigadeId || !periode) return
    setExportLoading(true)
    try {
      await exportService.exporterExcel(brigadeId, periode)
      toast.success('Fichier Excel téléchargé ✓')
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setExportLoading(false)
    }
  }

  /**
   * Charge la liste des brigades pour le sélecteur.
   * On réutilise les fiches pour extraire les brigades uniques.
   * (pas de route GET /brigades accessible à l'IGT dans la démo)
   */
  const { data: fichesData } = useQuery({
    queryKey: ['fiches', undefined, 1],
    queryFn: () => fichesService.getAll({ limit: 100 })
  })

  /**
   * Extrait les brigades uniques depuis les fiches.
   * reduce → parcourt le tableau et construit un objet Map
   * pour dédupliquer par brigadeId.
   */
  const brigades = fichesData?.data
    ? Array.from(
        fichesData.data.reduce((map, fiche) => {
          if (!map.has(fiche.brigadeId)) {
            map.set(fiche.brigadeId, fiche.brigade)
          }
          return map
        }, new Map<string, { id: string; nom: string; chef: string }>())
        .values()
      )
    : []

  /**
   * Charge le rapport seulement si brigade ET période sont sélectionnés.
   * enabled: !!brigadeId → désactive la query si brigadeId est vide.
   */
  const {
    data: rapport,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['rapport', brigadeId, periode],
    queryFn: () => rapportsService.getRapport(brigadeId, periode),
    enabled: !!brigadeId && !!periode
  })

  // Données pour le graphique donut
  const pieData = rapport ? [
    { name: 'Conformes',     value: rapport.nbConformes,    color: '#00897B' },
    { name: 'Réserves',      value: rapport.nbReserves,     color: '#D97706' },
    { name: 'Non conformes', value: rapport.nbNonConformes, color: '#DC2626' }
  ].filter(d => d.value > 0) : []

  // Génère la liste des 12 derniers mois pour le sélecteur
  const derniersMois = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const mois = String(date.getMonth() + 1).padStart(2, '0')
    const annee = date.getFullYear()
    return {
      value: `${annee}-${mois}`,
      label: formatPeriode(`${annee}-${mois}`)
    }
  })

  return (
    <PageLayout title="Rapports mensuels">
      <div className="space-y-4">

        {/* ── SÉLECTEURS ───────────────────────────────────────── */}
        <Card>
          <Card.Body>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Sélecteur brigade */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Brigade
                </label>
                <select
                  value={brigadeId}
                  onChange={(e) => setBrigadeId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 text-sm bg-white focus:outline-none focus:border-[#1B6B93] focus:ring-2 focus:ring-[#D9EAF5]"
                >
                  <option value="">Sélectionner une brigade...</option>
                  {brigades.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nom} — {b.chef}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélecteur période */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Période
                </label>
                <select
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 text-sm bg-white focus:outline-none focus:border-[#1B6B93] focus:ring-2 focus:ring-[#D9EAF5]"
                >
                  {derniersMois.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* ── ÉTAT VIDE — pas de brigade sélectionnée ──────────── */}
        {!brigadeId && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[#D9EAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={28} className="text-[#0D3B66]" />
            </div>
            <h3 className="text-gray-600 font-medium mb-1">
              Sélectionnez une brigade
            </h3>
            <p className="text-gray-400 text-sm">
              Choisissez une brigade et une période pour générer le rapport
            </p>
          </div>
        )}

        {/* ── CHARGEMENT ───────────────────────────────────────── */}
        {brigadeId && isLoading && (
          <div className="flex justify-center py-12">
            <SpinnerPage />
          </div>
        )}

        {/* ── ERREUR ───────────────────────────────────────────── */}
        {brigadeId && isError && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              Aucune donnée pour cette période
            </p>
          </div>
        )}

        {/* ── RAPPORT ──────────────────────────────────────────── */}
        {rapport && (
          <div className="space-y-4">

            {/* En-tête rapport */}
            <div className="p-4 bg-[#0D3B66] rounded-2xl text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-blue-200 mb-1">
                    GEOCODING × ANEP — Marché 05/2025/ANEP
                  </div>
                  <h2 className="text-lg font-bold">
                    Rapport {formatPeriode(rapport.periode)}
                  </h2>
                  <p className="text-blue-200 text-sm">
                    {rapport.brigade.nom} — {rapport.brigade.chef}
                  </p>
                </div>

                {/* Bouton export */}
                <Button
                  variant="success"
                  size="md"
                  loading={exportLoading}
                  onClick={handleExport}
                >
                  <Download size={16} />
                  Exporter Excel
                </Button>
              </div>
            </div>

            {/* KPIs en grille */}
            <div className="grid grid-cols-2 gap-3">
              <StatItem
                icon={FileText}
                label="Fiches validées"
                value={rapport.nbFichesValidees}
                color="text-[#0D3B66]"
              />
              <StatItem
                icon={Wrench}
                label="Missions"
                value={rapport.nbMissions}
                color="text-[#1B6B93]"
              />
              <StatItem
                icon={CheckCircle}
                label="Contrôles"
                value={rapport.nbControles}
                color="text-gray-600"
              />
              <StatItem
                icon={TrendingUp}
                label="Conformité"
                value={`${rapport.tauxConformite}%`}
                color={rapport.tauxConformite >= 80 ? 'text-[#00897B]' : 'text-orange-600'}
              />
            </div>

            {/* Graphique donut + détail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Donut */}
              <Card>
                <Card.Header>Répartition contrôles</Card.Header>
                <Card.Body>
                  {rapport.nbControles === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                      Aucun contrôle ce mois
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: any) => `${v ?? 0} contrôles`}
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(v) => (
                            <span style={{ fontSize: '12px', color: '#6B7280' }}>{v}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>

              {/* Détail chiffres */}
              <Card>
                <Card.Header>Détail</Card.Header>
                <Card.Body className="space-y-3">
                  {[
                    { label: 'Conformes', value: rapport.nbConformes, color: 'text-[#00897B]', bg: 'bg-teal-50' },
                    { label: 'Réserves', value: rapport.nbReserves, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Non conformes', value: rapport.nbNonConformes, color: 'text-red-600', bg: 'bg-red-50' }
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`flex items-center justify-between p-3 ${bg} rounded-xl`}>
                      <span className={`text-sm font-medium ${color}`}>{label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${color}`}>{value}</span>
                        {rapport.nbControles > 0 && (
                          <span className={`text-xs ${color} opacity-70`}>
                            {Math.round((value / rapport.nbControles) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </div>

            {/* Ouvrages NON_CONFORMES */}
            {rapport.ouvragesNonConformes.length > 0 && (
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-600" />
                    <span>
                      Ouvrages non conformes ({rapport.ouvragesNonConformes.length})
                    </span>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="divide-y divide-gray-50">
                    {rapport.ouvragesNonConformes.map((ouvrage, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">

                        {/* Rang */}
                        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-red-600">{i + 1}</span>
                        </div>

                        {/* Infos ouvrage */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900">
                            {ouvrage.reference}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {ouvrage.designation}
                          </div>
                        </div>

                        {/* Nombre NC */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-sm font-bold text-red-600">
                            {ouvrage.nbNonConformes}
                          </div>
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