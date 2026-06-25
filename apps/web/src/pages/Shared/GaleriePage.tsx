/**
 * @file GaleriePage.tsx — M2
 * Galerie photos géoréférencées par mission
 * MOCK : données statiques
 */
import { useState } from 'react'
import { Camera, MapPin, Filter } from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card }       from '../../components/ui/Card'

const MOCK_PHOTOS = [
  { id: '1', ref: 'CRE-A-01', lat: '33.5482', lng: '-7.6680', date: '22/06', legende: 'Vue d\'ensemble crémaillère', brigade: 'Équipe 01', mission: { zone: 'A', axe: 'A14', nature: 'Réception AV bétonnage' } },
  { id: '2', ref: 'CRE-A-01', lat: '33.5483', lng: '-7.6679', date: '22/06', legende: 'Détail ancrage inférieur',    brigade: 'Équipe 01', mission: { zone: 'A', axe: 'A14', nature: 'Réception AV bétonnage' } },
  { id: '3', ref: 'VO-B-12',  lat: '33.5491', lng: '-7.6671', date: '21/06', legende: 'Voile axe D09 — verticalité', brigade: 'Équipe 02', mission: { zone: 'B', axe: 'B07', nature: 'Contrôle verticalité' } },
  { id: '4', ref: 'PT-C14',   lat: '33.5476', lng: '-7.6688', date: '20/06', legende: 'Poteau RDC avant bétonnage',  brigade: 'Équipe 03', mission: { zone: 'C', axe: 'C14', nature: 'Réception AV bétonnage' } },
  { id: '5', ref: 'ASS-C22',  lat: '33.5468', lng: '-7.6695', date: '19/06', legende: 'Regard assainissement fond de fouille', brigade: 'Équipe 01', mission: { zone: 'C', axe: 'C22', nature: 'Contrôle fond fouille' } },
  { id: '6', ref: 'GR-B-03',  lat: '33.5488', lng: '-7.6662', date: '18/06', legende: 'Gradin préfab niveau R+1',    brigade: 'Équipe 02', mission: { zone: 'B', axe: 'B03', nature: 'Réception AP bétonnage' } },
  { id: '7', ref: 'SE-A-08',  lat: '33.5475', lng: '-7.6700', date: '17/06', legende: 'Semelle isolée coffrée',       brigade: 'Équipe 04', mission: { zone: 'A', axe: 'A08', nature: 'Réception AV bétonnage' } },
  { id: '8', ref: 'DA-C-05',  lat: '33.5480', lng: '-7.6692', date: '16/06', legende: 'Dalle de plancher Zone C',     brigade: 'Équipe 03', mission: { zone: 'C', axe: 'C05', nature: 'Contrôle planimétrie' } },
]

const BRIGADES = ['Toutes', 'Équipe 01', 'Équipe 02', 'Équipe 03', 'Équipe 04']

export function GaleriePage() {
  const [brigadeFil, setBrigadeFil] = useState('Toutes')
  const [selected, setSelected]     = useState<typeof MOCK_PHOTOS[0] | null>(null)

  const photos = brigadeFil === 'Toutes' ? MOCK_PHOTOS : MOCK_PHOTOS.filter(p => p.brigade === brigadeFil)

  return (
    <PageLayout title="Galerie photos">
      <div className="space-y-4">

        {/* ── HEADER INFO ── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Vues géoréférencées — <strong>{photos.length} photos</strong> rattachées à leurs missions
          </p>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select value={brigadeFil} onChange={e => setBrigadeFil(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B6B93]">
              {BRIGADES.map(b => <option key={b}>{b}</option>)}
            </select>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none">
              <option>Jour : Tous</option>
            </select>
          </div>
        </div>

        {/* ── CARTE SIMPLIFIÉE ── */}
        <Card>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <MapPin size={16} className="text-[#1B6B93]" />
            <span className="text-sm font-semibold text-[#0D3B66]">Carte des prises de vue</span>
            <span className="ml-auto text-xs text-gray-400">© OpenStreetMap</span>
          </div>
          {/* Carte SVG simulée */}
          <div className="relative bg-[#e8f0e8] h-48 overflow-hidden">
            <svg viewBox="0 0 800 200" className="w-full h-full">
              {/* Fond */}
              <rect width="800" height="200" fill="#e8ede8" />
              {/* Routes */}
              <line x1="0" y1="100" x2="800" y2="100" stroke="#ccc" strokeWidth="2" />
              <line x1="400" y1="0" x2="400" y2="200" stroke="#ccc" strokeWidth="2" />
              {/* Stade (ellipse) */}
              <ellipse cx="400" cy="100" rx="120" ry="60" fill="none" stroke="#0D3B66" strokeWidth="2" strokeDasharray="8 4" />
              <text x="400" y="105" textAnchor="middle" fill="#0D3B66" fontSize="12" fontWeight="bold">Grand Stade</text>
              {/* Marqueurs photos */}
              {photos.map((p, i) => {
                const x = 200 + (i * 60) % 500
                const y = 50 + (i * 37) % 120
                const colors: Record<string, string> = { 'Équipe 01': '#0D3B66', 'Équipe 02': '#1B6B93', 'Équipe 03': '#00897B', 'Équipe 04': '#D97706' }
                return (
                  <g key={p.id} onClick={() => setSelected(p)} style={{ cursor: 'pointer' }}>
                    <circle cx={x} cy={y} r="8" fill={colors[p.brigade]} stroke="white" strokeWidth="2" />
                    <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">
                      📷
                    </text>
                  </g>
                )
              })}
            </svg>
            {/* Légende */}
            <div className="absolute bottom-2 left-3 flex gap-3">
              {['Équipe 01', 'Équipe 02', 'Équipe 03', 'Équipe 04'].map((b, i) => (
                <div key={b} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${['bg-[#0D3B66]', 'bg-[#1B6B93]', 'bg-[#00897B]', 'bg-amber-500'][i]}`} />
                  <span className="text-[10px] text-gray-600">{b.replace('Équipe ', 'Éq. ')}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ── GRILLE PHOTOS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {photos.map(p => (
            <div key={p.id} onClick={() => setSelected(p)}
              className="relative rounded-xl overflow-hidden cursor-pointer group aspect-square bg-gray-200 hover:ring-2 hover:ring-[#1B6B93] transition-all">
              {/* Placeholder photo */}
              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                <Camera size={28} className="text-gray-500" />
              </div>
              {/* Badge ref */}
              <div className="absolute top-2 left-2 bg-[#0D3B66] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {p.ref}
              </div>
              {/* GPS */}
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {p.lat}, {p.lng}
              </div>
              {/* Date */}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {p.date}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[#0D3B66]/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center">
                <p className="text-white text-xs font-semibold">{p.legende}</p>
                <p className="text-white/70 text-[10px] mt-1">{p.brigade}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── MODAL DÉTAIL PHOTO ── */}
        {selected && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="aspect-video bg-gray-200 rounded-xl flex items-center justify-center mb-4">
                <Camera size={48} className="text-gray-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-[#0D3B66] text-white px-2 py-0.5 rounded-full">{selected.ref}</span>
                  <span className="text-xs text-gray-500">{selected.brigade} · {selected.date}</span>
                </div>
                <p className="font-semibold text-gray-900">{selected.legende}</p>
                <p className="text-sm text-gray-500">Zone {selected.mission.zone} · Axe {selected.mission.axe}</p>
                <p className="text-sm text-[#1B6B93]">{selected.mission.nature}</p>
                <p className="text-xs text-gray-400 font-mono">GPS : {selected.lat}, {selected.lng}</p>
              </div>
              <button onClick={() => setSelected(null)}
                className="mt-4 w-full h-10 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  )
}