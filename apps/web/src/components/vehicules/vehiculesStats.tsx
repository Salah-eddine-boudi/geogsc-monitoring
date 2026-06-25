import { Car, Wrench, CheckCircle } from 'lucide-react';
import type { Vehicule } from '../../types/vehicules.types';

export function VehiculesStats({ vehicules }: { vehicules: Vehicule[] }) {
  const total = vehicules.length;
  const enMaintenance = vehicules.filter(v => v.statut === 'MAINTENANCE').length;
  const actifs = vehicules.filter(v => v.statut === 'EN_SERVICE').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
          <Car size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-500">Total Véhicules</p>
          <p className="text-2xl font-black text-[#0D3B66]">{total}</p>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
          <Wrench size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-500">En Maintenance</p>
          <p className="text-2xl font-black text-[#0D3B66]">{enMaintenance}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
          <CheckCircle size={24} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-500">Disponibles & Actifs</p>
          <p className="text-2xl font-black text-[#0D3B66]">{actifs}</p>
        </div>
      </div>
    </div>
  );
}