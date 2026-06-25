/**
 * @file GenerateurPage.tsx — M14
 * Générateur de rapport mensuel ANEP
 * MOCK : sources simulées
 */
import { useState } from 'react'
import { CheckCircle, FileText, Users, Package, DollarSign, Calendar, Download, Eye, Edit3 } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card }       from '../../components/ui/Card'
import { Button }     from '../../components/ui/Button'
import toast from 'react-hot-toast'

const SOURCES = [
  { id: 'fiches',     icon: FileText,   label: 'Fiches journalières', detail: '8 fiches · 9 réceptions', ok: true },
  { id: 'evenements', icon: Calendar,   label: 'Événements CP',       detail: '3 événements',            ok: true },
  { id: 'rh',         icon: Users,      label: 'Ressources RH',       detail: '6 personnes',             ok: true },
  { id: 'materiel',   icon: Package,    label: 'Matériel',            detail: '5 équipements',           ok: true },
  { id: 'caisse',     icon: DollarSign, label: 'Caisse projet',       detail: '5 opérations',            ok: true },
]

const SECTIONS = [
  { num: 1,   titre: 'Présentation du projet',     statut: 'AUTO',    desc: 'Rempli automatiquement depuis les données' },
  { num: 2,   titre: 'Méthodologie de contrôle',   statut: 'AUTO',    desc: 'Rempli automatiquement depuis les données' },
  { num: 3,   titre: 'Contrôles réalisés',         statut: 'AUTO',    desc: 'Rempli automatiquement depuis les données' },
  { num: 4.1, titre: 'Moyens humains (RH)',        statut: 'AUTO',    desc: 'Rempli automatiquement depuis les données' },
  { num: 4.2, titre: 'Moyens matériels',           statut: 'AUTO',    desc: 'Rempli automatiquement depuis les données' },
  { num: 5,   titre: 'Non-conformités & réserves', statut: 'AUTO',    desc: 'Rempli automatiquement depuis les données' },
  { num: 6,   titre: 'Synthèse & conclusion du DP',statut: 'REDIGER', desc: 'Saisie éditoriale du Directeur de projet' },
]

export function GenerateurPage() {
  const [generating, setGenerating] = useState(false)
  const [editionSection, setEditionSection] = useState<number | null>(null)

  const handleGenerer = async () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      toast.success('Rapport généré — téléchargement en cours...')
    }, 2000)
  }

  const pretes = SECTIONS.filter(s => s.statut === 'AUTO').length

  return (
    <PageLayout
      title="Générateur de rapport"
      action={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => toast('Prévisualisation Word...')}>
            <Eye size={16} />
            <span className="hidden sm:inline">Prévisualiser Word</span>
          </Button>
          <Button variant="primary" size="sm" loading={generating} onClick={handleGenerer}>
            <Download size={16} />
            Générer .docx
          </Button>
        </div>
      }
    >
      <div className="space-y-4">

        {/* ── BANDEAU OK ── */}
        <div className="flex items-center gap-3 px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl">
          <CheckCircle size={18} className="text-teal-600 flex-shrink-0" />
          <p className="text-sm font-medium text-teal-700">
            Toutes les sources sont consolidées et à jour — le rapport est prêt à générer.
          </p>
        </div>

        {/* ── SOURCES CONSOLIDÉES ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sources consolidées</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {SOURCES.map(s => (
              <Card key={s.id}>
                <Card.Body>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-[#D9EAF5] rounded-lg">
                      <s.icon size={16} className="text-[#1B6B93]" />
                    </div>
                    <CheckCircle size={16} className="text-teal-500" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{s.label}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{s.detail}</p>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>

        {/* ── STRUCTURE DU RAPPORT ── */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-[#0D3B66]">Structure du rapport — format ANEP</h2>
            <span className="text-xs text-[#1B6B93] font-medium">{pretes}/{SECTIONS.length} prêtes</span>
          </div>
          <div className="divide-y divide-gray-50">
            {SECTIONS.map(s => (
              <div key={s.num} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-600">{s.num}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{s.titre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.statut === 'AUTO' ? (
                    <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
                      Automatique
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                      À rédiger
                    </span>
                  )}
                  <button
                    onClick={() => setEditionSection(s.num === editionSection ? null : s.num)}
                    className="flex items-center gap-1 text-xs text-[#1B6B93] hover:text-[#0D3B66] font-medium">
                    {s.statut === 'REDIGER' ? <><Edit3 size={13} /> Éditer</> : <><Eye size={13} /> Voir</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── SECTION ÉDITABLE ── */}
        {editionSection && (
          <Card>
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-[#0D3B66]">
                Section {editionSection} — {SECTIONS.find(s => s.num === editionSection)?.titre}
              </p>
            </div>
            <Card.Body>
              <textarea rows={6}
                placeholder="Rédigez ici la synthèse et conclusion du Directeur de projet..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-sm resize-none focus:outline-none focus:border-[#1B6B93]"
              />
              <div className="flex gap-2 mt-3">
                <Button variant="primary" size="sm" onClick={() => toast.success('Section sauvegardée')}>
                  Sauvegarder
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditionSection(null)}>
                  Fermer
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* ── PHOTOS ── */}
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#1B6B93]" />
              <span className="text-sm font-semibold text-[#0D3B66]">Photos à inclure dans le rapport</span>
            </div>
            <span className="text-xs text-gray-400">0 / 20 sélectionnées</span>
          </div>
          <Card.Body>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#1B6B93] hover:bg-[#D9EAF5] transition-all">
                  <span className="text-xs text-gray-300">+</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Cliquez pour ajouter une photo à l'annexe photographique du rapport (max 20).</p>
          </Card.Body>
        </Card>

      </div>
    </PageLayout>
  )
}