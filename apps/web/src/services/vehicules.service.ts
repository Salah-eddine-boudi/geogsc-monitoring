/**
 * @file vehicules.service.ts
 * @description Service de communication avec l'API pour les véhicules.
 */

import type { Vehicule } from '../types/vehicules.types';
// import { api } from './api'; <-- À décommenter quand le backend sera prêt

const MOCK_VEHICULES: Vehicule[] = [
  { id: '1', marque: 'Dacia Duster', immatriculation: '12345-A-6', affectation: 'Brigade Topo 1', statut: 'EN_SERVICE', kilometrage: '45 200 km', localisation: 'Zone A' },
  { id: '2', marque: 'Toyota Hilux', immatriculation: '98765-B-1', affectation: 'Chef de Chantier', statut: 'EN_SERVICE', kilometrage: '12 400 km', localisation: 'Base Vie' },
  { id: '3', marque: 'Peugeot Partner', immatriculation: '45612-C-3', affectation: 'Équipe Qualité', statut: 'MAINTENANCE', kilometrage: '89 000 km', localisation: 'Garage Central' },
  { id: '4', marque: 'Dacia Duster', immatriculation: '33445-A-6', affectation: 'Brigade Topo 2', statut: 'ALERTE', kilometrage: '105 000 km', localisation: 'Zone C' },
];

export const vehiculesService = {
  /**
   * Récupère la liste de tous les véhicules du chantier
   */
  getAll: async (): Promise<Vehicule[]> => {
    // return (await api.get('/vehicules')).data;
    
    // Simulation réseau (500ms)
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_VEHICULES), 500);
    });
  }
};