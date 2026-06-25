/**
 * @file DemandesPage.tsx
 * @description M3 — Demandes RH & logistique.
 * Workflow : Demandé → En cours → Traité / Refusé
 * Visible uniquement par l'assistante, le CP et le DP.
 *
 * ROUTES : /demandes
 * ACCÈS  : ADMIN, IGT
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Clock, CheckCircle, XCircle, ChevronRight, Info } from 'lucide-react'
import { PageLayout }  from '../../components/layout/PageLayout'
import { Card }        from '../../components/ui/Card'
import { Button }      from '../../components/ui/Button'
import { Modal }       from '../../components/ui/Modal'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── TYPES ────────────────────────────────────────────────────────

type StatutDemande = 'DEMANDE' | 'EN_COURS' | 'TRAITE' | 'REFUSE'
type TypeDemande   = 'CONGE' | 'ATTESTATION' | 'EQUIPEMENT' | 'VIDANGE' | 'DOTATION_CAISSE' | 'AUTRE'

interface Demande {
  id:          string
  type:        TypeDemande
  description: string
  statut:      StatutDemande
  createdAt:   string
  user:        { nom: string; prenom: string; brigade?: { nom: string } }
}

// ─── HELPERS ──────────────────────────────────────────────────────

function typeLabel(t: TypeDemande) {
  const map: Record<TypeDemande, string> = {
    CONGE:          'Congé',
    ATTESTATION:    'Attestation',
    EQUIPEMENT:     'Équipement',
    VIDANGE:        'Vidange véhicule',
    DOTATION_CAISSE: 'Dotation caisse',
    AUTRE:          'Autre',
  }
  return map[t] ?? t
}

function typeColor(t: TypeDemande) {
  const map: Record<TypeDemande, string> = {
    CONGE:          'bg-blue-100 text-blue-700',
    ATTESTATION:    'bg-purple-100 text-purple-700',
    EQUIPEMENT:     'bg-amber-100 text-amber-700',
    VIDANGE:        'bg-orange-100 text-orange-700',
    DOTATION_CAISSE: 'bg-teal-100 text-teal-700',
    AUTRE:          'bg-gray-100 text-gray-600',
  }
  return map[t] ?? 'bg-gray-100 text-gray-600'
}

function statutBadge(s: StatutDemande) {
  const map: Record<StatutDemande, string> = {
    DEMANDE:  'bg-blue-50 text-blue-600 border border-blue-200',
    EN_COURS: 'bg-amber-50 text-amber-700 border border-amber-200',
    TRAITE:   'bg-teal-50 text-teal-700 border border-teal-200',
    REFUSE:   'bg-red-50 text-red-600 border border-red-200',
  }
  return map[s] ?? ''
}

function statutLabel(s: StatutDemande) {
  const map: Record<StatutDemande, string> = {
    DEMANDE:  'Demandé',
    EN_COURS: 'En cours',
    TRAITE:   'Traité',
    REFUSE:   'Refusé',
  }
  return map[s] ?? s
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

// ─── PAGE ─────────────────────────────────────────────────────────

export function DemandesPage() {
  const [filtre, setFiltre] = useState<'TOUTES' | StatutDemande>('TOUTES')

  // Données mockées — à remplacer par useQuery vers /demandes
  const demandes: Demande[] = [
    { id: '1', type: 'CONGE', description: 'Congé annuel 10 jours', statut: 'DEMANDE', createdAt: '2026-06-20', user: { nom: 'AIT KADIR', prenom: 'Marouane', brigade: { nom: 'Équipe 01' } } },
    { id: '2', type: 'ATTESTATION', description: 'Attestation de travail pour visa', statut: 'TRAITE', createdAt: '2026-06-18', user: { nom: 'JEMI', prenom: 'Karim', brigade: { nom: 'Équipe 03' } } },
    { id: '3', type: 'EQUIPEMENT', description: 'Gilet réfléchissant taille L', statut: 'EN_COURS', createdAt: '2026-06-15', user: { nom: 'TAKI', prenom: 'Hassan', brigade: { nom: 'Équipe 04' } } },
    { id: '4', type: 'VIDANGE', description: 'Vidange véhicule Kangoo 67890-B-2', statut: 'DEMANDE', createdAt: '2026-06-14', user: { nom: 'BENNANI', prenom: 'Youssef', brigade: { nom: 'Équipe 02' } } },
    { id: '5', type: 'AUTRE', description: 'Demande de déplacement exceptionnel', statut: 'REFUSE', createdAt: '2026-06-10', user: { nom: 'AIT KADIR', prenom: 'Marouane', brigade: { nom: 'Équipe 01' } } },
  ]

  const total     = demandes.length
  const aTraiter  = demandes.filter(d => d.statut === 'DEMANDE').length
  const traitees  = demandes.filter(d => d.statut === 'TRAITE').length
  const refusees  = demandes.filter(d => d.statut === 'REFUSE').length

  const filtrees = filtre === 'TOUTES' ? demandes : demandes.filter(d => d.statut === filtre)

  const handleTraiter = async (id: string) => {
    toast.success('Demande marquée comme traitée')
  }

  const handleRefuser = async (id: string) => {
    toast.error('Demande refusée')
  }

  return (
    <PageLayout title="Demandes RH & logistique">
      <div className="space-y-4">

        {/* ── INFO WORKFLOW ── */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#D9EAF5] border border-[#1B6B93]/20 rounded-xl">
          <Info size={16} className="text-[#1B6B93] flex-shrink-0" />
          <p className="text-sm text-[#0D3B66]">
            Visible uniquement par l'assistante, le CP et le DP.{' '}
            Workflow : Demandé → En cours → Traité / Refusé.
          </p>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total demandes', value: total,    icon: ClipboardList, color: 'text-[#0D3B66]', bg: 'bg-[#D9EAF5]' },
            { label: 'À traiter',      value: aTraiter, icon: Clock,         color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Traitées',       value: traitees, icon: CheckCircle,   color: 'text-teal-600',  bg: 'bg-teal-50' },
            { label: 'Refusées',       value: refusees, icon: XCircle,       color: 'text-red-600',   bg: 'bg-red-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                  <div className={`p-2.5 rounded-xl ${bg}`}>
                    <Icon size={20} className={color} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>

        {/* ── FILTRES ── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['TOUTES', 'DEMANDE', 'EN_COURS', 'TRAITE', 'REFUSE'] as const).map(f => (
            <button key={f} onClick={() => setFiltre(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtre === f
                  ? 'bg-[#0D3B66] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1B6B93]'
              }`}>
              {f === 'TOUTES' ? 'Toutes'
               : f === 'DEMANDE' ? 'Demandé'
               : f === 'EN_COURS' ? 'En cours'
               : f === 'TRAITE' ? 'Traité'
               : 'Refusé'}
            </button>
          ))}
        </div>

        {/* ── LISTE DEMANDES ── */}
        <Card>
          <Card.Body className="p-0">
            {filtrees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <ClipboardList size={28} className="mb-2 text-gray-200" />
                <p className="text-sm">Aucune demande dans cette catégorie</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtrees.map(d => (
                  <div key={d.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-[#0D3B66] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {d.user.prenom[0]}{d.user.nom[0]}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {d.user.prenom} {d.user.nom}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeColor(d.type)}`}>
                          {typeLabel(d.type)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statutBadge(d.statut)}`}>
                          {statutLabel(d.statut)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{d.description}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {d.user.brigade?.nom} · {formatDate(d.createdAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    {d.statut === 'DEMANDE' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="success" size="sm" onClick={() => handleTraiter(d.id)}>
                          <CheckCircle size={14} />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleRefuser(d.id)}>
                          <XCircle size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

      </div>
    </PageLayout>
  )
}