/**
 * @file vehicules.types.ts
 * @description Définitions des types pour le module de gestion du parc automobile.
 */

export type StatutVehicule = 'EN_SERVICE' | 'MAINTENANCE' | 'ALERTE';

export interface Vehicule {
  id: string;
  marque: string;
  immatriculation: string;
  affectation: string;
  statut: StatutVehicule;
  kilometrage: string;
  localisation: string;
}