/**
 * @file DashboardPage.tsx
 * @description Dashboard IGT — vue globale du chantier GSC.
 *
 * CONTENU (CDC §3.7.1) :
 * → KPIs : fiches, missions, conformes, NC, taux — par mois
 * → LineChart : évolution journalière volume + taux conformité
 * → BarChart empilé : répartition par type d'ouvrage
 * → BarChart horizontal : top natures d'intervention
 * → BarChart groupé : comparaison inter-brigades
 * → Tableau NC récentes : cliquable → détail fiche
 * → Fiches soumises en attente de validation
 *
 * UN SEUL appel API → GET /dashboard/stats?periode=YYYY-MM
 * (remplace les 3 appels séparés de l'ancienne version)
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
import { PageLayout }   from '../../components/layout/PageLayout'
import { Badge }        from '../../components/ui/Badge'
import { Card }         from '../../components/ui/Card'
import { Button }       from '../../components/ui/Button'
import { SpinnerPage }  from '../../components/ui/Spinner'
import { dashboardService } from '../../services/dashboard.service'

// ─── CHARTE COULEURS GEOCODING ────────────────────────────────────
// Définies ici pour être réutilisées dans tous les graphiques Recharts.
// Recharts n'utilise pas TailwindCSS → couleurs hex directes obligatoires.

const COLORS = {
  navy:        '#0D3B66',  // Header, titres, boutons primaires
  blue:        '#1B6B93',  // Liens, accents
  teal:        '#00897B',  // CONFORME, succès
  light:       '#D9EAF5',  // Fonds cartes secondaires
  rouge:       '#DC2626',  // NON_CONFORME, erreurs
  orange:      '#D97706',  // RESERVE, avertissements
  gris:        '#6B7280',  // Neutre
}

// ─── HELPERS ──────────────────────────────────────────────────────

/**
 * Formate "2026-06" → "Juin 2026" pour l'affichage du sélecteur.
 */
function formatPeriode(periode: string): string {
  const [annee, mois] = periode.split('-')
  const date = new Date(Number(annee), Number(mois) - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

/**
 * Génère la liste des 12 derniers mois pour le sélecteur.
 * Format : [{ value: "2026-06", label: "Juin 2026" }, ...]
 */
function getDerniersMois(n = 12) {
  const mois = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = d.toISOString().slice(0, 7)
    mois.push({ value, label: formatPeriode(value) })
  }
  return mois
}

/**
 * Formate "CONTROLE_COFFRAGE" → "Contrôle coffrage" pour les labels.
 */
function formatNature(nature: string): string {
  return nature
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, c => c.toUpperCase())
}

/**
 * Formate "POTEAU_CREMAILLERE_AV_BETONNAGE" → "Poteau crémaillère" (abrégé).
 */
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
  }
  return map[type] ?? type
}

// ─── COMPOSANT KPI CARD ───────────────────────────────────────────

/**
 * KpiCard — carte indicateur clé.
 * trend : variation vs mois précédent (optionnel, ex: "+5")
 */
function KpiCard({
  icon: Icon, label, value, color, subtitle, trend
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  subtitle?: string
  trend?: string
}) {
  return (
    <Card>
      <Card.Body>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className={`text-3xl font-bold ${color} mb-1`}>
              {value}
            </div>
            <div className="text-sm font-medium text-gray-700 truncate">
              {label}
            </div>
            {subtitle && (
              <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
            )}
            {trend && (
              <div className={`text-xs font-medium mt-1 ${
                trend.startsWith('+') ? 'text-[#00897B]' : 'text-[#DC2626]'
              }`}>
                {trend} vs mois préc.
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
            <Icon size={22} className={color} />
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

// ─── TOOLTIP PERSONNALISÉ RECHARTS ────────────────────────────────

/**
 * Tooltip Recharts avec le style GEOCODING.
 * Utilisé sur tous les graphiques pour homogénéité.
 */
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

  // Période sélectionnée — mois courant par défaut
  const [periode, setPeriode] = useState<string>(
    new Date().toISOString().slice(0, 7)
  )

  // Brigade sélectionnée — undefined = toutes les brigades
  const [brigadeIdFiltre, setBrigadeIdFiltre] = useState<string | undefined>()

  const moisDisponibles = getDerniersMois(12)

  /**
   * Un seul appel API → toutes les données du dashboard.
   * React Query met en cache → re-fetch uniquement si période change.
   * queryKey contient période + brigade → invalidation automatique au changement.
   */
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'stats', periode, brigadeIdFiltre],
    queryFn: () => dashboardService.getStats({
      periode,
      brigadeId: brigadeIdFiltre
    }),
    staleTime: 2 * 60 * 1000,  // 2 min — dashboard : refresh modéré suffisant
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

  const stats = data!

  // Données pour le donut de conformité
  const pieData = [
    { name: 'Conformes',      value: stats.kpis.conformes,    color: COLORS.teal   },
    { name: 'Réserves',       value: stats.kpis.reserves,     color: COLORS.orange },
    { name: 'Non conformes',  value: stats.kpis.nonConformes, color: COLORS.rouge  },
  ].filter(d => d.value > 0)  // masquer les segments à 0

  // Données du LineChart — format "06/01" pour les labels courts
  const evolutionData = stats.evolutionJournaliere.map(d => ({
    ...d,
    dateLabel: d.date.slice(5).replace('-', '/'),  // "2026-06-01" → "06/01"
  }))

  // Données BarChart ouvrage — noms abrégés pour les labels
  const ouvrageData = stats.repartitionOuvrage.map(d => ({
    ...d,
    typeLabel: formatOuvrage(d.type),
  }))

  // Données BarChart nature — noms formatés
  const natureData = stats.repartitionNature.map(d => ({
    ...d,
    natureLabel: formatNature(d.nature),
  }))

  return (
    <PageLayout
      title="Dashboard"
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/rapports')}
        >
          <BarChart3 size={16} />
          <span className="hidden sm:inline">Rapports</span>
        </Button>
      }
    >
      <div className="space-y-6">

        {/* ── FILTRES PÉRIODE + BRIGADE ────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">

          {/* Sélecteur de mois */}
          <select
            value={periode}
            onChange={e => setPeriode(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B6B93]"
          >
            {moisDisponibles.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Filtre brigade — "Toutes" par défaut */}
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

          {/* Période affichée */}
          <span className="text-sm text-gray-400 ml-auto hidden sm:block">
            {formatPeriode(periode)}
          </span>
        </div>

        {/* ── KPIs ─────────────────────────────────────────────── */}
        {/*
          * 2 colonnes mobile → 4 colonnes desktop.
          * Données réelles depuis l'API (plus de calculs fictifs).
          */}
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

        {/* ── ÉVOLUTION JOURNALIÈRE (LineChart) ────────────────── */}
        {/*
          * CDC §3.7.1 : "Graphique d'évolution temporelle (courbe volume + taux)"
          * 2 lignes : nb missions (axe gauche) + taux conformité % (axe droit)
          */}
        {evolutionData.length > 0 && (
          <Card>
            <Card.Header>Évolution journalière — {formatPeriode(periode)}</Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={evolutionData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />

                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11, fill: COLORS.gris }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />

                  {/* Axe gauche : nb missions */}
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: COLORS.gris }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />

                  {/* Axe droit : taux conformité 0-100% */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: COLORS.gris }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v}%`}
                    width={40}
                  />

                  <Tooltip content={<GeoTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={v => <span style={{ fontSize: 12, color: COLORS.gris }}>{v}</span>}
                  />

                  {/* Courbe nb missions */}
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="missions"
                    name="Missions"
                    stroke={COLORS.navy}
                    strokeWidth={2}
                    dot={{ r: 3, fill: COLORS.navy }}
                    activeDot={{ r: 5 }}
                  />

                  {/* Courbe taux conformité */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="taux"
                    name="Taux conformité %"
                    stroke={COLORS.teal}
                    strokeWidth={2}
                    strokeDasharray="5 3"  // pointillé pour différencier
                    dot={{ r: 3, fill: COLORS.teal }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        )}

        {/* ── DONUT + FICHES EN ATTENTE ─────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Graphique donut conformité — données réelles */}
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
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${v} missions`, '']}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={v => <span style={{ fontSize: 12, color: COLORS.gris }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>

          {/* Fiches soumises en attente */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <span>Fiches à valider</span>
                {stats.kpis.fichesSoumises > 0 && (
                  <span className="text-xs font-normal bg-[#D9EAF5] text-[#0D3B66] px-2 py-0.5 rounded-full">
                    {stats.kpis.fichesSoumises} en attente
                  </span>
                )}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {stats.ncRecentes.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm p-4">
                  Aucune fiche en attente ✓
                </div>
              ) : (
                // Affiche les fiches via les NC récentes pour éviter un 2ème appel API
                // → clic → redirection vers la fiche complète
                <div className="divide-y divide-gray-50">
                  {stats.ncRecentes.slice(0, 5).map((nc) => (
                    <button
                      key={nc.id}
                      onClick={() => navigate(`/fiches/${nc.ficheId}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
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

        {/* ── RÉPARTITION PAR TYPE D'OUVRAGE (BarChart empilé) ──── */}
        {/*
          * CDC §3.7.1 : "Répartition par type d'ouvrage (barres empilées par équipe)"
          * Chaque barre = 1 type d'ouvrage, empilée C/R/NC
          */}
        {ouvrageData.length > 0 && (
          <Card>
            <Card.Header>Missions par type d'ouvrage</Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ouvrageData} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis
                    dataKey="typeLabel"
                    tick={{ fontSize: 10, fill: COLORS.gris }}
                    tickLine={false}
                    angle={-35}         // labels inclinés pour lisibilité mobile
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: COLORS.gris }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip content={<GeoTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: 8 }}
                    formatter={v => <span style={{ fontSize: 12, color: COLORS.gris }}>{v}</span>}
                  />

                  {/* Barres empilées — stackId identique → empilement */}
                  <Bar dataKey="conformes"   name="Conformes"     stackId="a" fill={COLORS.teal}   radius={[0, 0, 0, 0]} />
                  <Bar dataKey="reserves"    name="Réserves"      stackId="a" fill={COLORS.orange} />
                  <Bar dataKey="nonConformes" name="Non conformes" stackId="a" fill={COLORS.rouge} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        )}

        {/* ── NATURES + COMPARAISON BRIGADES ────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Top natures d'intervention */}
          {natureData.length > 0 && (
            <Card>
              <Card.Header>Top natures d'intervention</Card.Header>
              <Card.Body>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={natureData}
                    layout="vertical"   // BarChart horizontal
                    margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: COLORS.gris }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="natureLabel"
                      tick={{ fontSize: 10, fill: COLORS.gris }}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip content={<GeoTooltip />} />
                    <Bar
                      dataKey="total"
                      name="Missions"
                      fill={COLORS.blue}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          )}

          {/* Comparaison inter-brigades */}
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
                  <BarChart
                    data={stats.comparaisonBrigades}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis
                      dataKey="brigade"
                      tick={{ fontSize: 11, fill: COLORS.gris }}
                      tickLine={false}
                    />
                    {/* Axe gauche : nb missions */}
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: COLORS.gris }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    {/* Axe droit : taux conformité */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: COLORS.gris }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `${v}%`}
                      width={38}
                    />
                    <Tooltip content={<GeoTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={v => <span style={{ fontSize: 12, color: COLORS.gris }}>{v}</span>}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="missions"
                      name="Missions"
                      fill={COLORS.navy}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="taux"
                      name="Taux (%)"
                      fill={COLORS.teal}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>
          )}
        </div>

        {/* ── TABLEAU NC RÉCENTES ───────────────────────────────── */}
        {/*
          * CDC §3.7.1 : "Tableau des NC du jour/semaine (cliquable → détail)"
          * Clic sur une ligne → navigate vers la FicheDetailPage
          */}
        {stats.ncRecentes.length > 0 && (
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#DC2626]" />
                Non-conformités récentes
                <span className="ml-auto text-xs font-normal bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                  {stats.kpis.nonConformes} ce mois
                </span>
              </div>
            </Card.Header>

            {/* Tableau responsive — scroll horizontal sur mobile */}
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
                    <tr
                      key={nc.id}
                      onClick={() => navigate(`/fiches/${nc.ficheId}`)}
                      className="hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {nc.date}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {nc.brigade}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatOuvrage(nc.typeOuvrage)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {nc.nature ? formatNature(nc.nature) : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell max-w-xs truncate">
                        {nc.partieOuvrage ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight size={16} className="text-gray-300" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── ACCÈS RAPIDE ─────────────────────────────────────── */}
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
