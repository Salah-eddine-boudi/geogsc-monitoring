/**
 * @file DashboardPage.tsx
 * @description Dashboard IGT — vue globale du chantier GSC.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts'
import {
  FileText, CheckCircle, Clock, TrendingUp,
  AlertTriangle, BarChart3, ChevronRight, Users
} from 'lucide-react'
import { PageLayout }        from '../../components/layout/PageLayout'
import { Badge }             from '../../components/ui/Badge'
import { Card }              from '../../components/ui/Card'
import { Button }            from '../../components/ui/Button'
import { SpinnerPage }       from '../../components/ui/Spinner'
import { dashboardService }  from '../../services/dashboard.service'
import { useAuthStore }      from '../../stores/auth.store'
import type { DashboardStats } from '../../types/dashboard.types'

// ─── CHARTE COULEURS GEOCODING ────────────────────────────────────
const COLORS = {
  navy:   '#0D3B66',
  blue:   '#1B6B93',
  teal:   '#00897B',
  rouge:  '#DC2626',
  orange: '#D97706',
  gris:   '#6B7280',
}

// ─── HELPERS ──────────────────────────────────────────────────────

function formatPeriode(periode: string): string {
  const [annee, mois] = periode.split('-')
  const date = new Date(Number(annee), Number(mois) - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

/**
 * getDerniersMois — génère la liste des N derniers mois.
 *
 * CORRECTION DU BUG :
 * Avant : on utilisait toISOString() qui convertit en UTC.
 * Au Maroc (UTC+1/+2), minuit local = 22h ou 23h UTC la veille.
 * Résultat : "2026-03-01T00:00:00+01:00" → "2026-02-28T23:00:00Z"
 * → slice(0,7) donnait "2026-02" au lieu de "2026-03" → doublons !
 *
 * Maintenant : on utilise getFullYear() et getMonth() qui
 * retournent l'heure LOCALE → pas de décalage → pas de doublons.
 *
 * padStart(2, '0') : ajoute un zéro si le mois est < 10
 * ex: 3 → "03", 10 → "10"
 *
 * Set<string> : structure de données qui n'accepte pas les doublons.
 * seen.has(value) → vérifie si la valeur existe déjà
 * seen.add(value) → l'ajoute pour les vérifications suivantes
 */
function getDerniersMois(n = 12) {
  const mois = []
  const seen = new Set<string>()
  const now = new Date()

  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)

    // ✅ Heure locale — pas de conversion UTC
    const year  = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const value = `${year}-${month}`

    // N'ajoute que si pas déjà présent
    if (!seen.has(value)) {
      seen.add(value)
      mois.push({ value, label: formatPeriode(value) })
    }
  }
  return mois
}

/**
 * getCurrentPeriode — retourne le mois courant en format "YYYY-MM"
 * sans utiliser toISOString() pour éviter le même bug UTC.
 */
function getCurrentPeriode(): string {
  const now = new Date()
  const year  = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatNature(nature: string): string {
  return nature.toLowerCase().replace(/_/g, ' ').replace(/^./, c => c.toUpperCase())
}

function formatOuvrage(type: string): string {
  const map: Record<string, string> = {
    POTEAU: 'Poteau',
    POUTRE_CREMAILLERE_AV_BETONNAGE: 'Crémaillère AV',
    POUTRE_CREMAILLERE_AP_BETONNAGE: 'Crémaillère AP',
    GRADINS: 'Gradins',
    VOILE: 'Voile',
    CHAMBORD: 'Chambord',
    VOMITOIRE: 'Vomitoire',
    SEMELLE_FILANTE: 'Sem. filante',
    SEMELLE_ISOLEE: 'Sem. isolée',
    DALLES: 'Dalles',
    MUR_SOUTENEMENT: 'Mur sout.',
    TERRASSEMENT: 'Terrassement',
    ASSAINISSEMENT: 'Assainissement',
    PLATINE: 'Platine',
    AUTRE: 'Autre',
    GRADIN: 'Gradin',
    FONDATION: 'Fondation',
    VRD: 'VRD',
  }
  return map[type] ?? type
}

// ─── KPI CARD ─────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color, subtitle }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  subtitle?: string
}) {
  return (
    <Card>
      <Card.Body>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
            <div className="text-sm font-medium text-gray-700 truncate">{label}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
          </div>
          <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
            <Icon size={22} className={color} />
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

// ─── TOOLTIP RECHARTS ─────────────────────────────────────────────

function GeoTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
      {label && <div className="font-medium text-gray-700 mb-2">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name} :</span>
          <span className="font-medium text-gray-900">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── PAGE DASHBOARD ───────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  /**
   * getCurrentPeriode() au lieu de new Date().toISOString().slice(0,7)
   * pour éviter le bug UTC sur le mois courant.
   */
  const [periode, setPeriode] = useState<string>(getCurrentPeriode())
  const [brigadeIdFiltre, setBrigadeIdFiltre] = useState<string | undefined>()
  const moisDisponibles = getDerniersMois(12)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'stats', periode, brigadeIdFiltre],
    queryFn: () => dashboardService.getStats({ periode, brigadeId: brigadeIdFiltre }),
    staleTime: 2 * 60 * 1000,
    enabled: isAuthenticated,
  })

  if (isLoading) return <SpinnerPage />

  if (isError) {
    return (
      <PageLayout title="Dashboard">
        <div className="flex items-center justify-center h-48 text-red-500 text-sm">
          Erreur de chargement — réessayez dans quelques instants
        </div>
      </PageLayout>
    )
  }

  const stats = data as DashboardStats

  const pieData = [
    { name: 'Conformes',     value: stats.kpis.conformes,    color: COLORS.teal   },
    { name: 'Réserves',      value: stats.kpis.reserves,     color: COLORS.orange },
    { name: 'Non conformes', value: stats.kpis.nonConformes, color: COLORS.rouge  },
  ].filter(d => d.value > 0)

  const evolutionData = stats.evolutionJournaliere.map(d => ({
    ...d,
    dateLabel: d.date.slice(5).replace('-', '/'),
  }))

  const ouvrageData = stats.repartitionOuvrage.map(d => ({
    ...d,
    typeLabel: formatOuvrage(d.type),
  }))

  const natureData = stats.repartitionNature.map(d => ({
    ...d,
    natureLabel: formatNature(d.nature),
  }))

  return (
    <PageLayout
      title="Dashboard"
      action={
        <Button variant="secondary" size="sm" onClick={() => navigate('/rapports')}>
          <BarChart3 size={16} />
          <span className="hidden sm:inline">Rapports</span>
        </Button>
      }
    >
      <div className="space-y-6">

        {/* ── FILTRES ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={periode}
            onChange={e => setPeriode(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B6B93]"
          >
            {moisDisponibles.map((m, index) => (
              <option key={`${m.value}-${index}`} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {stats.comparaisonBrigades.length > 0 && (
            <select
              value={brigadeIdFiltre ?? ''}
              onChange={e => setBrigadeIdFiltre(e.target.value || undefined)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B6B93]"
            >
              <option value="">Toutes les brigades</option>
              {stats.comparaisonBrigades.map(b => (
                <option key={b.brigadeId} value={b.brigadeId}>{b.brigade}</option>
              ))}
            </select>
          )}

          <span className="text-sm text-gray-400 ml-auto hidden sm:block">
            {formatPeriode(periode)}
          </span>
        </div>

        {/* ── KPIs ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={FileText}
            label="Total fiches"
            value={stats.kpis.totalFiches}
            color="text-[#0D3B66]"
            subtitle={formatPeriode(periode)}
          />
          <KpiCard
            icon={Clock}
            label="En attente"
            value={stats.kpis.fichesSoumises}
            color="text-[#1B6B93]"
            subtitle="À valider"
          />
          <KpiCard
            icon={CheckCircle}
            label="Missions"
            value={stats.kpis.totalMissions}
            color="text-[#00897B]"
            subtitle={`${stats.kpis.conformes} conformes`}
          />
          <KpiCard
            icon={TrendingUp}
            label="Conformité"
            value={`${stats.kpis.tauxConformite}%`}
            color={stats.kpis.tauxConformite >= 80 ? 'text-[#00897B]' : 'text-orange-600'}
            subtitle={`${stats.kpis.nonConformes} NC`}
          />
        </div>

        {/* ── ÉVOLUTION JOURNALIÈRE ─────────────────────────────── */}
        {evolutionData.length > 0 && (
          <Card>
            <Card.Header>Évolution journalière — {formatPeriode(periode)}</Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={evolutionData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: COLORS.gris }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: COLORS.gris }} tickLine={false} axisLine={false} width={30} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.gris }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} width={40} />
                  <Tooltip content={<GeoTooltip />} />
                  <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span style={{ fontSize: 12, color: COLORS.gris }}>{v}</span>} />
                  <Line yAxisId="left" type="monotone" dataKey="missions" name="Missions" stroke={COLORS.navy} strokeWidth={2} dot={{ r: 3, fill: COLORS.navy }} activeDot={{ r: 5 }} />
                  <Line yAxisId="right" type="monotone" dataKey="taux" name="Taux conformité %" stroke={COLORS.teal} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: COLORS.teal }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        )}

        {/* ── DONUT + NC RÉCENTES ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <Card.Header>Répartition des contrôles</Card.Header>
            <Card.Body>
              {stats.kpis.totalMissions === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  Pas encore de données ce mois
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
  <PieChart>
    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
    </Pie>
    <Tooltip content={<GeoTooltip />} />
    <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span style={{ fontSize: 12, color: COLORS.gris }}>{v}</span>} />
  </PieChart>
</ResponsiveContainer>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <span>NC récentes</span>
                {stats.kpis.nonConformes > 0 && (
                  <span className="text-xs font-normal bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                    {stats.kpis.nonConformes} ce mois
                  </span>
                )}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {stats.ncRecentes.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm p-4">
                  Aucune NC ce mois ✓
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {stats.ncRecentes.slice(0, 5).map((nc) => (
                    <button
                      key={nc.id}
                      onClick={() => navigate(`/fiches/${nc.ficheId}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#DC2626] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{nc.brigade}</div>
                        <div className="text-xs text-gray-500">
                          {nc.date} · {formatOuvrage(nc.typeOuvrage)}
                          {nc.nature && ` · ${formatNature(nc.nature)}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="non-conforme">NC</Badge>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* ── RÉPARTITION PAR OUVRAGE ───────────────────────────── */}
        {ouvrageData.length > 0 && (
          <Card>
            <Card.Header>Missions par type d'ouvrage</Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ouvrageData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="typeLabel" tick={{ fontSize: 10, fill: COLORS.gris }} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: COLORS.gris }} tickLine={false} axisLine={false} width={28} />
                  <Tooltip content={<GeoTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 8 }} formatter={(v: string) => <span style={{ fontSize: 12, color: COLORS.gris }}>{v}</span>} />
                  <Bar dataKey="conformes"    name="Conformes"     stackId="a" fill={COLORS.teal} />
                  <Bar dataKey="reserves"     name="Réserves"      stackId="a" fill={COLORS.orange} />
                  <Bar dataKey="nonConformes" name="Non conformes" stackId="a" fill={COLORS.rouge} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        )}

        {/* ── NATURES + COMPARAISON BRIGADES ────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {natureData.length > 0 && (
            <Card>
              <Card.Header>Top natures d'intervention</Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={natureData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.gris }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="natureLabel" tick={{ fontSize: 10, fill: COLORS.gris }} tickLine={false} width={120} />
                    <Tooltip content={<GeoTooltip />} />
                    <Bar dataKey="total" name="Missions" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          )}

          {stats.comparaisonBrigades.length > 1 && (
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#1B6B93]" />
                  Comparaison brigades
                </div>
              </Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.comparaisonBrigades} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="brigade" tick={{ fontSize: 11, fill: COLORS.gris }} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: COLORS.gris }} tickLine={false} axisLine={false} width={28} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.gris }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} width={38} />
                    <Tooltip content={<GeoTooltip />} />
                    <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span style={{ fontSize: 12, color: COLORS.gris }}>{v}</span>} />
                    <Bar yAxisId="left"  dataKey="missions" name="Missions" fill={COLORS.navy} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="taux"     name="Taux (%)" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          )}
        </div>

        {/* ── TABLEAU NC COMPLET ────────────────────────────────── */}
        {stats.ncRecentes.length > 0 && (
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#DC2626]" />
                Toutes les NC du mois
              </div>
            </Card.Header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left font-medium">Date</th>
                    <th className="px-4 py-2.5 text-left font-medium">Brigade</th>
                    <th className="px-4 py-2.5 text-left font-medium">Ouvrage</th>
                    <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Nature</th>
                    <th className="px-4 py-2.5 text-left font-medium hidden lg:table-cell">Partie</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.ncRecentes.map((nc) => (
                    <tr key={nc.id} onClick={() => navigate(`/fiches/${nc.ficheId}`)} className="hover:bg-red-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{nc.date}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{nc.brigade}</td>
                      <td className="px-4 py-3 text-gray-700">{formatOuvrage(nc.typeOuvrage)}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{nc.nature ? formatNature(nc.nature) : '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell max-w-xs truncate">{nc.partieOuvrage ?? '—'}</td>
                      <td className="px-4 py-3"><ChevronRight size={16} className="text-gray-300" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── ACCÈS RAPIDE ──────────────────────────────────────── */}
        <Card>
          <Card.Header>Accès rapide</Card.Header>
          <Card.Body>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" size="md" onClick={() => navigate('/fiches')}>
                <FileText size={16} />
                Toutes les fiches
              </Button>
              <Button variant="secondary" size="md" onClick={() => navigate('/rapports')}>
                <BarChart3 size={16} />
                Rapports mensuels
              </Button>
            </div>
          </Card.Body>
        </Card>

      </div>
    </PageLayout>
  )
}