/**
 * @file MaterielPage.tsx
 * @description M11 — Inventaire matériel.
 * Liste le matériel sur chantier avec alertes étalonnage > 6 mois.
 *
 * ROUTES : /materiel
 * ACCÈS  : ADMIN, IGT
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, CheckCircle, AlertTriangle, Wrench, Plus, Download } from 'lucide-react'
import { PageLayout }  from '../../components/layout/PageLayout'
import { Card }        from '../../components/ui/Card'
import { Button }      from '../../components/ui/Button'
import { SpinnerPage } from '../../components/ui/Spinner'
import { Modal }       from '../../components/ui/Modal'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── TYPES ────────────────────────────────────────────────────────

interface Materiel {
  id:               string
  type:             string
  marque:           string
  modele:           string
  numeroSerie:      string
  brigadeId?:       string
  brigade?:         { nom: string }
  statut:           'OPERATIONNEL' | 'MAINTENANCE' | 'HORS_SERVICE'
  dernierEtalonnage?: string
}

// ─── HELPERS ──────────────────────────────────────────────────────

function statutColor(statut: string) {
  const map: Record<string, string> = {
    OPERATIONNEL:  'bg-teal-100 text-teal-700',
    MAINTENANCE:   'bg-orange-100 text-orange-700',
    HORS_SERVICE:  'bg-red-100 text-red-700',
  }
  return map[statut] ?? 'bg-gray-100 text-gray-600'
}

function statutLabel(statut: string) {
  const map: Record<string, string> = {
    OPERATIONNEL: 'Opérationnel',
    MAINTENANCE:  'Maintenance',
    HORS_SERVICE: 'Hors service',
  }
  return map[statut] ?? statut
}

function isEtalonnageDepasse(date?: string): boolean {
  if (!date) return false
  const d = new Date(date)
  const sixMoisAgo = new Date()
  sixMoisAgo.setMonth(sixMoisAgo.getMonth() - 6)
  return d < sixMoisAgo
}

function formatDate(date?: string): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR')
}

// ─── MODAL AJOUT ──────────────────────────────────────────────────

function AjoutMaterielModal({ isOpen, onClose, onSuccess }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void
}) {
  const [form, setForm] = useState({ type: '', marque: '', modele: '', numeroSerie: '', statut: 'OPERATIONNEL' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/materiel', form)
      toast.success('Matériel ajouté')
      onSuccess(); onClose()
    } catch { toast.error('Erreur lors de l\'ajout') }
    finally { setLoading(false) }
  }

  const inputClass = "w-full h-11 px-3 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-[#1B6B93]"

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter du matériel">
      <form onSubmit={handleSubmit} className="space-y-3">
        {[
          { label: 'Type', key: 'type', placeholder: 'ex: Station totale' },
          { label: 'Marque', key: 'marque', placeholder: 'ex: Leica' },
          { label: 'Modèle', key: 'modele', placeholder: 'ex: TS16' },
          { label: 'N° de série', key: 'numeroSerie', placeholder: 'ex: 1820-4471' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
            <input
              type="text" placeholder={placeholder} required
              className={inputClass}
              value={(form as any)[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" size="md" onClick={onClose} className="flex-1">Annuler</Button>
          <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">Ajouter</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────

export function MaterielPage() {
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()

  // Données mockées en attendant l'API /materiel
  const materielMock: Materiel[] = [
    { id: '1', type: 'Station totale', marque: 'Leica', modele: 'TS16 N°1', numeroSerie: '1820-4471', statut: 'OPERATIONNEL', dernierEtalonnage: '2026-02-12', brigade: { nom: 'Équipe 01' } },
    { id: '2', type: 'Station totale', marque: 'Leica', modele: 'TS16 N°2', numeroSerie: '1820-4472', statut: 'OPERATIONNEL', dernierEtalonnage: '2026-02-12', brigade: { nom: 'Équipe 02' } },
    { id: '3', type: 'GPS GNSS',       marque: 'Leica', modele: 'GS18',     numeroSerie: 'GS18-0093', statut: 'MAINTENANCE',   dernierEtalonnage: '2025-08-11', brigade: { nom: 'Équipe 03' } },
    { id: '4', type: 'Niveau optique', marque: 'Sokkia', modele: 'B40A',    numeroSerie: 'B40-1175',  statut: 'OPERATIONNEL', dernierEtalonnage: '2026-03-20', brigade: { nom: 'Équipe 04' } },
    { id: '5', type: 'Trépied + canne', marque: 'Leica', modele: 'GST120',  numeroSerie: 'GST-7781',  statut: 'HORS_SERVICE', brigade: { nom: 'Équipe 01' } },
  ]

  const operationnels = materielMock.filter(m => m.statut === 'OPERATIONNEL').length
  const maintenance   = materielMock.filter(m => m.statut === 'MAINTENANCE' || m.statut === 'HORS_SERVICE').length
  const etalonnageKo  = materielMock.filter(m => isEtalonnageDepasse(m.dernierEtalonnage)).length

  return (
    <PageLayout
      title="Inventaire matériel"
      action={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => {}}>
            <Download size={16} />
            <span className="hidden sm:inline">Export PDF audit</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            <span className="hidden sm:inline">Ajouter matériel</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Matériel total', value: materielMock.length, sub: 'sur chantier', icon: Package, color: 'text-[#1B6B93]', bg: 'bg-[#D9EAF5]' },
            { label: 'Opérationnel',   value: operationnels,       icon: CheckCircle,   color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Maintenance / HS', value: maintenance,       icon: Wrench,        color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Étalonnage à prévoir', value: etalonnageKo,  sub: '> 6 mois',    icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <Card key={label}>
              <Card.Body>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                    {sub && <div className="text-xs text-gray-400">{sub}</div>}
                  </div>
                  <div className={`p-2.5 rounded-xl ${bg}`}>
                    <Icon size={20} className={color} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>

        {/* ── ALERTE ÉTALONNAGE ── */}
        {etalonnageKo > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {etalonnageKo} appareil{etalonnageKo > 1 ? 's' : ''} avec un étalonnage de plus de 6 mois — à planifier.
            </p>
          </div>
        )}

        {/* ── TABLEAU ── */}
        <Card>
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-[#0D3B66]">Parc matériel</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Marque / Modèle</th>
                  <th className="px-4 py-3 text-left font-semibold">N° Série</th>
                  <th className="px-4 py-3 text-left font-semibold">Brigade</th>
                  <th className="px-4 py-3 text-left font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold">Dernier étalonnage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {materielMock.map(m => {
                  const depasse = isEtalonnageDepasse(m.dernierEtalonnage)
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{m.type}</td>
                      <td className="px-4 py-3 text-gray-600">{m.marque} {m.modele}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.numeroSerie}</td>
                      <td className="px-4 py-3 text-[#1B6B93] text-sm">{m.brigade?.nom ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutColor(m.statut)}`}>
                          {statutLabel(m.statut)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={depasse ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {formatDate(m.dernierEtalonnage)}
                          {depasse && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">&gt; 6 mois</span>}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      <AjoutMaterielModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['materiel'] })}
      />
    </PageLayout>
  )
}