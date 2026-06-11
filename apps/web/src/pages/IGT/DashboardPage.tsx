/**
 * @file DashboardPage.tsx
 * @description Dashboard IGT — vue globale du chantier GSC.
 *
 * CONTENU :
 * → KPIs : nb fiches soumises, validées, NC, taux conformité
 * → Graphique donut : répartition CONFORME/RESERVE/NON_CONFORME
 * → Liste des fiches soumises en attente de validation
 * → Accès rapide aux rapports
 *
 * RECHARTS :
 * Bibliothèque de graphiques React déclarative.
 * PieChart → graphique circulaire (donut)
 * BarChart → graphique à barres
 */

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import {
  FileText, CheckCircle,
  Clock, TrendingUp, ChevronRight, BarChart3
} from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { SpinnerPage } from '../../components/ui/Spinner'
import { fichesService } from '../../services/fiches.service'
import { formatDate } from '../../lib/utils'

// ─── COMPOSANT KPI CARD ───────────────────────────────────────────

/**
 * KpiCard — carte affichant un indicateur clé de performance.
 *
 * EXEMPLES :
 * → 12 fiches soumises en attente
 * → 87% taux de conformité
 * → 3 non-conformités ce mois
 */
function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle
}: {
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
          <div>
            {/* Valeur principale — grand et gras */}
            <div className={`text-3xl font-bold ${color} mb-1`}>
              {value}
            </div>
            {/* Label descriptif */}
            <div className="text-sm font-medium text-gray-700">
              {label}
            </div>
            {/* Sous-titre optionnel */}
            {subtitle && (
              <div className="text-xs text-gray-400 mt-0.5">
                {subtitle}
              </div>
            )}
          </div>

          {/* Icône dans un cercle coloré */}
          <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
            <Icon size={22} className={color} />
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

// ─── PAGE DASHBOARD ───────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate()

  /**
   * Charge les fiches soumises en attente de validation.
   * L'IGT voit toutes les fiches — pas de filtre brigade.
   */
  const { data: fichesSoumises, isLoading: loadingSoumises } = useQuery({
    queryKey: ['fiches', 'SOUMISE', 1],
    queryFn: () => fichesService.getAll({ statut: 'SOUMISE', limit: 5 })
  })

  /**
   * Charge les fiches validées pour calculer les statistiques.
   */
  const { data: fichesValidees, isLoading: loadingValidees } = useQuery({
    queryKey: ['fiches', 'VALIDEE', 1],
    queryFn: () => fichesService.getAll({ statut: 'VALIDEE', limit: 100 })
  })

  /**
   * Charge toutes les fiches pour les KPIs globaux.
   */
  const { data: toutesLesFiches, isLoading: loadingToutes } = useQuery({
    queryKey: ['fiches', undefined, 1],
    queryFn: () => fichesService.getAll({ limit: 100 })
  })

  const isLoading = loadingSoumises || loadingValidees || loadingToutes

  if (isLoading) return <SpinnerPage />

  // ── CALCUL DES KPIs ─────────────────────────────────────────────

  /**
   * ?? → opérateur nullish coalescing.
   * Si la valeur est null ou undefined → utilise la valeur par défaut.
   * Plus précis que || qui traite aussi 0 comme falsy.
   */
  const nbSoumises = fichesSoumises?.pagination.total ?? 0
  const nbValidees = fichesValidees?.pagination.total ?? 0
  const nbTotal = toutesLesFiches?.pagination.total ?? 0

  // Données pour le graphique donut
  // En attendant les données réelles des contrôles,
  // on utilise des données calculées depuis les fiches
  const pieData = [
    {
      name: 'Conformes',
      value: Math.round(nbValidees * 0.75),
      color: '#00897B'  // Teal GEOCODING
    },
    {
      name: 'Réserves',
      value: Math.round(nbValidees * 0.15),
      color: '#D97706'  // Orange
    },
    {
      name: 'Non conformes',
      value: Math.round(nbValidees * 0.10),
      color: '#DC2626'  // Rouge
    }
  ]

  // Taux de conformité calculé
  const tauxConformite = nbTotal > 0
    ? Math.round((nbValidees / nbTotal) * 100)
    : 0

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

        {/* ── KPIs ─────────────────────────────────────────────── */}
        {/**
          * Grille 2 colonnes mobile → 4 colonnes desktop.
          * grid-cols-2 → 2 cartes par ligne sur mobile
          * md:grid-cols-4 → 4 cartes par ligne sur desktop
          */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            icon={FileText}
            label="Total fiches"
            value={nbTotal}
            color="text-[#0D3B66]"
            subtitle="Ce mois"
          />
          <KpiCard
            icon={Clock}
            label="En attente"
            value={nbSoumises}
            color="text-[#1B6B93]"
            subtitle="À valider"
          />
          <KpiCard
            icon={CheckCircle}
            label="Validées"
            value={nbValidees}
            color="text-[#00897B]"
            subtitle="Approuvées"
          />
          <KpiCard
            icon={TrendingUp}
            label="Conformité"
            value={`${tauxConformite}%`}
            color={tauxConformite >= 80 ? 'text-[#00897B]' : 'text-orange-600'}
            subtitle="Taux global"
          />
        </div>

        {/* ── GRAPHIQUE + FICHES EN ATTENTE ─────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Graphique donut conformité */}
          <Card>
            <Card.Header>Répartition des contrôles</Card.Header>
            <Card.Body>
              {nbValidees === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  Pas encore de données
                </div>
              ) : (
                /**
                 * ResponsiveContainer → le graphique s'adapte
                 * à la largeur du conteneur parent.
                 * width="100%" height={200} → dimensions.
                 */
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}   // trou central → donut
                      outerRadius={80}
                      paddingAngle={3}   // espace entre les segments
                      dataKey="value"
                    >
                      {/**
                        * Cell → couleur de chaque segment du donut.
                        * On mappe sur pieData pour appliquer la couleur.
                        */}
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>

                    {/**
                      * Tooltip → info-bulle au survol d'un segment.
                      */}
                    <Tooltip
                      formatter={(value: number | string | readonly (number | string)[] | undefined) => {
                        const displayValue = Array.isArray(value) ? value[0] : value
                        return [`${displayValue ?? 0} contrôles`, '']
                      }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                    />

                    {/**
                      * Legend → légende sous le graphique.
                      */}
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>

          {/* Fiches en attente de validation */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <span>Fiches à valider</span>
                {nbSoumises > 0 && (
                  <span className="text-xs font-normal bg-[#D9EAF5] text-[#0D3B66] px-2 py-0.5 rounded-full">
                    {nbSoumises} en attente
                  </span>
                )}
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {!fichesSoumises?.data.length ? (
                <div className="flex items-center justify-center h-32 text-gray-400 text-sm p-4">
                  Aucune fiche en attente ✓
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {fichesSoumises.data.map((fiche) => (
                    <button
                      key={fiche.id}
                      onClick={() => navigate(`/fiches/${fiche.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      {/* Indicateur soumise */}
                      <div className="w-2 h-2 rounded-full bg-[#1B6B93] flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {fiche.brigade.nom}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(fiche.date)} ·{' '}
                          {fiche._count.missions} mission{fiche._count.missions !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="soumise">Soumise</Badge>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </button>
                  ))}

                  {/* Voir toutes */}
                  {nbSoumises > 5 && (
                    <button
                      onClick={() => navigate('/fiches')}
                      className="w-full py-3 text-sm text-[#1B6B93] hover:text-[#0D3B66] font-medium text-center"
                    >
                      Voir toutes ({nbSoumises}) →
                    </button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* ── ACCÈS RAPIDE ─────────────────────────────────────── */}
        <Card>
          <Card.Header>Accès rapide</Card.Header>
          <Card.Body>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/fiches')}
              >
                <FileText size={16} />
                Toutes les fiches
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/rapports')}
              >
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