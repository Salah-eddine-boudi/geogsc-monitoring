/**
 * @file VehiculesPage.tsx
 * @description M12 — Gestion parc véhicules.
 * Suivi km, alertes assurance/vignette, historique vidanges.
 *
 * ROUTES : /vehicules
 * ACCÈS  : ADMIN, IGT
 */

import { useState } from 'react'
import { Truck, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { PageLayout }  from '../../components/layout/PageLayout'
import { Card }        from '../../components/ui/Card'
import { Button }      from '../../components/ui/Button'

// ─── TYPES ────────────────────────────────────────────────────────

interface Vehicule {
  id:               string
  marque:           string
  modele:           string
  immatriculation:  string
  brigade:          string
  kilometrage?:     number
  assuranceEcheance?: string
  vignetteEcheance?:  string
  vidange?:           string
  statut:           'FAIT' | 'EN_ATTENTE' | 'ANOMALIE'
  alertes:          string[]
}

// ─── HELPERS ──────────────────────────────────────────────────────

function isExpired(date?: string): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

function isSoon(date?: string, days = 30): boolean {
  if (!date) return false
  const d = new Date(date)
  const limit = new Date()
  limit.setDate(limit.getDate() + days)
  return d <= limit && d >= new Date()
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { month: '2-digit', year: '2-digit' })
}

function statutBadge(v: Vehicule) {
  if (v.statut === 'FAIT')       return 'bg-teal-100 text-teal-700'
  if (v.statut === 'ANOMALIE')   return 'bg-red-100 text-red-700'
  return 'bg-orange-100 text-orange-700'
}

function statutLabel(v: Vehicule) {
  if (v.statut === 'FAIT')       return 'Fait'
  if (v.statut === 'ANOMALIE')   return 'Anomalie'
  return 'En attente'
}

// ─── PAGE ─────────────────────────────────────────────────────────

export function VehiculesPage() {
  const [expanded, setExpanded] = useState<string | null>(null)

  // Données mockées
  const vehicules: Vehicule[] = [
    {
      id: '1', marque: 'Dacia', modele: 'Duster', immatriculation: '12345-A-6',
      brigade: 'Équipe 01', kilometrage: 12450,
      assuranceEcheance: '2027-03-01', vignetteEcheance: '2026-11-01',
      vidange: '02/2026', statut: 'FAIT', alertes: [],
    },
    {
      id: '2', marque: 'Renault', modele: 'Kangoo', immatriculation: '67890-B-2',
      brigade: 'Équipe 02',
      assuranceEcheance: '2027-01-01', vignetteEcheance: '2025-11-01',
      vidange: '11/2025', statut: 'EN_ATTENTE',
      alertes: ['Vignette à échéance'],
    },
    {
      id: '3', marque: 'Dacia', modele: 'Logan', immatriculation: '24680-C-4',
      brigade: 'Équipe 03', kilometrage: 41230,
      assuranceEcheance: '2025-12-01', vignetteEcheance: '2026-06-01',
      vidange: '08/2025', statut: 'FAIT',
      alertes: ['Assurance échue', 'Anomalie'],
    },
    {
      id: '4', marque: 'Renault', modele: 'Kangoo', immatriculation: '13579-D-8',
      brigade: 'Équipe 04',
      assuranceEcheance: '2026-12-01', vignetteEcheance: '2026-09-01',
      vidange: '03/2026', statut: 'EN_ATTENTE', alertes: [],
    },
  ]

  const total      = vehicules.length
  const releves    = vehicules.filter(v => v.kilometrage).length
  const alertes    = vehicules.filter(v => v.alertes.length > 0).length
  const anomalies  = vehicules.filter(v => v.statut === 'ANOMALIE' || v.alertes.some(a => a.includes('Anomalie'))).length
  const vidanges   = vehicules.filter(v => {
    if (!v.vidange) return false
    const [m, y] = v.vidange.split('/')
    const d = new Date(Number('20' + y), Number(m) - 1, 1)
    const limit = new Date(); limit.setMonth(limit.getMonth() - 3)
    return d <= limit
  }).length

  const prochaineDotation = '25/06/2026'
  const montantDotation   = '1 500 DH / véhicule'

  return (
    <PageLayout title="Suivi véhicule mensuel">
      <div className="space-y-4">

        {/* ── INFO DOTATION ── */}
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <Info size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Prochaine dotation gasoil : <strong>{prochaineDotation}</strong> — montant fixe{' '}
            <strong>{montantDotation}</strong> (défini par l'assistante).
          </p>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Parc véhicules', value: total,   icon: Truck,          color: 'text-[#1B6B93]', bg: 'bg-[#D9EAF5]' },
            { label: 'Relevés du mois', value: `${releves}/${total}`, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Alertes documents', value: alertes, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Anomalies déclarées', value: anomalies, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Vidanges à prévoir', value: vidanges, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
                  </div>
                  <div className={`p-2 rounded-xl ${bg}`}>
                    <Icon size={18} className={color} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>

        {/* ── LISTE VÉHICULES ── */}
        <div className="space-y-3">
          {vehicules.map(v => (
            <Card key={v.id}>
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-xl"
                onClick={() => setExpanded(expanded === v.id ? null : v.id)}
              >
                {/* Icône */}
                <div className="w-10 h-10 rounded-xl bg-[#D9EAF5] flex items-center justify-center flex-shrink-0">
                  <Truck size={18} className="text-[#1B6B93]" />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{v.marque} {v.modele}</span>
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {v.immatriculation}
                    </span>
                    {v.alertes.map(a => (
                      <span key={a} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        {a}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {v.brigade}
                    {v.kilometrage && ` · Compteur : ${v.kilometrage.toLocaleString('fr-MA')} km`}
                    {!v.kilometrage && ' · Compteur : non renseigné'}
                    {v.vidange && ` · Vidange : ${v.vidange}`}
                  </div>
                </div>

                {/* Statut + chevron */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutBadge(v)}`}>
                    {statutLabel(v)}
                  </span>
                  {expanded === v.id
                    ? <ChevronDown size={16} className="text-gray-400" />
                    : <ChevronRight size={16} className="text-gray-400" />
                  }
                </div>
              </div>

              {/* Détail déroulant */}
              {expanded === v.id && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { label: 'Assurance', value: v.assuranceEcheance, danger: isExpired(v.assuranceEcheance) },
                      { label: 'Vignette',  value: v.vignetteEcheance,  danger: isExpired(v.vignetteEcheance) },
                      { label: 'Vidange',   value: v.vidange ?? '—',    danger: false },
                      { label: 'Km compteur', value: v.kilometrage ? `${v.kilometrage.toLocaleString('fr-MA')} km` : 'Non renseigné', danger: !v.kilometrage },
                    ].map(({ label, value, danger }) => (
                      <div key={label} className="bg-white rounded-xl p-3 border border-gray-100">
                        <div className="text-xs text-gray-400 mb-1">{label}</div>
                        <div className={`text-sm font-semibold ${danger ? 'text-red-600' : 'text-gray-800'}`}>
                          {typeof value === 'string' ? value : formatDate(value ?? undefined)}
                        </div>
                        {danger && <div className="text-xs text-red-500 mt-0.5">⚠ Action requise</div>}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="secondary" size="sm">Saisir relevé km</Button>
                    <Button variant="secondary" size="sm">Voir historique</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

      </div>
    </PageLayout>
  )
}