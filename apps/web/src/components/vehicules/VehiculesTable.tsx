import { MapPin, CheckCircle, Wrench, AlertTriangle, MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

import type { Vehicule } from '../../types/vehicules.types';

export function VehiculesTable({ vehicules }: { vehicules: Vehicule[] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-[13px] uppercase tracking-wider text-gray-500 font-extrabold">
              <th className="px-6 py-4">Véhicule</th>
              <th className="px-6 py-4">Immatriculation</th>
              <th className="px-6 py-4">Affectation actuelle</th>
              <th className="px-6 py-4">Kilométrage</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicules.map((vehicule) => (
              <tr key={vehicule.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4 font-bold text-[#0D3B66] text-sm">{vehicule.marque}</td>
                <td className="px-6 py-4">
                  <div className="inline-flex px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-mono font-bold text-gray-700">
                    {vehicule.immatriculation}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-700 text-sm">{vehicule.affectation}</div>
                  <div className="text-xs text-gray-400 font-medium flex items-center mt-0.5">
                    <MapPin size={12} className="mr-1" /> {vehicule.localisation}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-600">{vehicule.kilometrage}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide",
                    vehicule.statut === 'EN_SERVICE' && "bg-teal-50 text-teal-700 border border-teal-200",
                    vehicule.statut === 'MAINTENANCE' && "bg-orange-50 text-orange-700 border border-orange-200",
                    vehicule.statut === 'ALERTE' && "bg-red-50 text-red-700 border border-red-200",
                  )}>
                    {vehicule.statut === 'EN_SERVICE' && <CheckCircle size={12} />}
                    {vehicule.statut === 'MAINTENANCE' && <Wrench size={12} />}
                    {vehicule.statut === 'ALERTE' && <AlertTriangle size={12} />}
                    {vehicule.statut.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-[#1B6B93] hover:bg-[#D9EAF5] rounded-lg transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}