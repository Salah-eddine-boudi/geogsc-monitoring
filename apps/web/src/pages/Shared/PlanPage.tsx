/**
 * @file PlanPage.tsx — M8
 * Plan du stade GSC avec zones A/B/C/D et marqueurs C/NC/gris
 * MOCK : données statiques
 */
import { useState } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { Card }       from '../../components/ui/Card'

const ZONES_STATS = [
  { id: 'A', label: 'Zone A — Nord', total: 312, conformes: 298, nc: 14, label2: 'Tribune Nord' },
  { id: 'B', label: 'Zone B — Est',  total: 261, conformes: 247, nc: 14, label2: 'Tribune Est'  },
  { id: 'C', label: 'Zone C — Sud',  total: 288, conformes: 270, nc: 18, label2: 'Tribune Sud'  },
  { id: 'D', label: 'Zone D — Ouest',total: 186, conformes: 178, nc:  8, label2: 'Tribune Ouest' },
]

export function PlanPage() {
  const [zoneActive, setZoneActive] = useState<string | null>(null)
  const [filtre, setFiltre] = useState<'TOUS' | 'CONFORME' | 'NC'>('TOUS')

  const zoneSelectionnee = ZONES_STATS.find(z => z.id === zoneActive)

  return (
    <PageLayout title="Plan du stade">
      <div className="space-y-4">

        {/* ── FILTRES ── */}
        <div className="flex gap-2">
          {(['TOUS', 'CONFORME', 'NC'] as const).map(f => (
            <button key={f} onClick={() => setFiltre(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtre === f ? 'bg-[#0D3B66] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#1B6B93]'
              }`}>
              {f === 'TOUS' ? 'Tous' : f === 'CONFORME' ? '✓ Conformes' : '✗ Non conformes'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── PLAN SVG ── */}
          <div className="lg:col-span-2">
            <Card>
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-[#0D3B66]">Stade GSC — Zones et axes topographiques</p>
              </div>
              <div className="p-4">
                <svg viewBox="0 0 600 500" className="w-full" style={{ maxHeight: 420 }}>
                  {/* Fond */}
                  <rect width="600" height="500" fill="#f8fafc" rx="12" />

                  {/* Pelouse centrale */}
                  <ellipse cx="300" cy="250" rx="140" ry="100" fill="#86efac" stroke="#4ade80" strokeWidth="2" />
                  <text x="300" y="255" textAnchor="middle" fill="#166534" fontSize="11" fontWeight="bold">Pelouse</text>

                  {/* Zone A — Nord */}
                  <path d="M 100 80 L 500 80 L 460 170 L 140 170 Z"
                    fill={zoneActive === 'A' ? '#D9EAF5' : '#f1f5f9'}
                    stroke={zoneActive === 'A' ? '#1B6B93' : '#cbd5e1'}
                    strokeWidth="2" className="cursor-pointer hover:fill-[#D9EAF5] transition-colors"
                    onClick={() => setZoneActive(zoneActive === 'A' ? null : 'A')} />
                  <text x="300" y="130" textAnchor="middle" fill="#0D3B66" fontSize="18" fontWeight="900" className="cursor-pointer" onClick={() => setZoneActive(zoneActive === 'A' ? null : 'A')}>A</text>
                  <text x="300" y="148" textAnchor="middle" fill="#64748b" fontSize="9">Tribune Nord</text>

                  {/* Zone B — Est */}
                  <path d="M 460 170 L 520 250 L 460 330 L 390 280 L 410 250 L 390 220 Z"
                    fill={zoneActive === 'B' ? '#D9EAF5' : '#f1f5f9'}
                    stroke={zoneActive === 'B' ? '#1B6B93' : '#cbd5e1'}
                    strokeWidth="2" className="cursor-pointer hover:fill-[#D9EAF5] transition-colors"
                    onClick={() => setZoneActive(zoneActive === 'B' ? null : 'B')} />
                  <text x="490" y="255" textAnchor="middle" fill="#0D3B66" fontSize="18" fontWeight="900" className="cursor-pointer" onClick={() => setZoneActive(zoneActive === 'B' ? null : 'B')}>B</text>
                  <text x="490" y="270" textAnchor="middle" fill="#64748b" fontSize="9">Est</text>

                  {/* Zone C — Sud */}
                  <path d="M 140 330 L 460 330 L 500 420 L 100 420 Z"
                    fill={zoneActive === 'C' ? '#D9EAF5' : '#f1f5f9'}
                    stroke={zoneActive === 'C' ? '#1B6B93' : '#cbd5e1'}
                    strokeWidth="2" className="cursor-pointer hover:fill-[#D9EAF5] transition-colors"
                    onClick={() => setZoneActive(zoneActive === 'C' ? null : 'C')} />
                  <text x="300" y="375" textAnchor="middle" fill="#0D3B66" fontSize="18" fontWeight="900" className="cursor-pointer" onClick={() => setZoneActive(zoneActive === 'C' ? null : 'C')}>C</text>
                  <text x="300" y="392" textAnchor="middle" fill="#64748b" fontSize="9">Tribune Sud</text>

                  {/* Zone D — Ouest */}
                  <path d="M 80 170 L 140 170 L 210 220 L 190 250 L 210 280 L 140 330 L 80 330 Z"
                    fill={zoneActive === 'D' ? '#D9EAF5' : '#f1f5f9'}
                    stroke={zoneActive === 'D' ? '#1B6B93' : '#cbd5e1'}
                    strokeWidth="2" className="cursor-pointer hover:fill-[#D9EAF5] transition-colors"
                    onClick={() => setZoneActive(zoneActive === 'D' ? null : 'D')} />
                  <text x="110" y="255" textAnchor="middle" fill="#0D3B66" fontSize="18" fontWeight="900" className="cursor-pointer" onClick={() => setZoneActive(zoneActive === 'D' ? null : 'D')}>D</text>
                  <text x="110" y="270" textAnchor="middle" fill="#64748b" fontSize="9">Ouest</text>

                  {/* Marqueurs de réceptions (simulés) */}
                  {[
                    { x: 180, y: 110, s: 'C' }, { x: 250, y: 120, s: 'C' }, { x: 350, y: 115, s: 'NC' },
                    { x: 420, y: 125, s: 'C' }, { x: 480, y: 220, s: 'C' }, { x: 485, y: 270, s: 'C' },
                    { x: 200, y: 360, s: 'C' }, { x: 300, y: 370, s: 'NC' }, { x: 400, y: 360, s: 'C' },
                    { x: 110, y: 200, s: 'C' }, { x: 108, y: 270, s: 'C' },
                  ].filter(m => filtre === 'TOUS' || (filtre === 'CONFORME' && m.s === 'C') || (filtre === 'NC' && m.s === 'NC'))
                   .map((m, i) => (
                    <circle key={i} cx={m.x} cy={m.y} r="6"
                      fill={m.s === 'C' ? '#00897B' : '#DC2626'}
                      stroke="white" strokeWidth="1.5" />
                  ))}
                </svg>

                {/* Légende */}
                <div className="flex items-center gap-4 mt-3 px-2">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#00897B]" /><span className="text-xs text-gray-500">Conforme</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#DC2626]" /><span className="text-xs text-gray-500">Non conforme</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-300" /><span className="text-xs text-gray-500">Pas d'intervention</span></div>
                  <span className="text-xs text-gray-400 ml-auto">Cliquer sur une zone pour le détail</span>
                </div>
              </div>
            </Card>
          </div>

          {/* ── STATS PAR ZONE ── */}
          <div className="space-y-3">
            {ZONES_STATS.map(z => (
              <Card key={z.id}>
                <div
                  className={`p-4 cursor-pointer rounded-xl transition-colors ${zoneActive === z.id ? 'bg-[#D9EAF5]' : 'hover:bg-gray-50'}`}
                  onClick={() => setZoneActive(zoneActive === z.id ? null : z.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black ${zoneActive === z.id ? 'bg-[#0D3B66] text-white' : 'bg-gray-100 text-[#0D3B66]'}`}>
                      {z.id}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{z.label2}</p>
                      <p className="text-xs text-gray-400">{z.total} réceptions</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Conformes</span>
                      <span className="font-semibold text-[#00897B]">{z.conformes}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#00897B] h-1.5 rounded-full" style={{ width: `${(z.conformes/z.total)*100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-red-500">NC : {z.nc}</span>
                      <span className="text-gray-400">{Math.round((z.conformes/z.total)*100)}%</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

        </div>
      </div>
    </PageLayout>
  )
}