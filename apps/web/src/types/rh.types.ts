export type StatutRH = 'PRESENT' | 'CONGE' | 'MALADIE';
export type TypeEmploye = 'GEOCODING' | 'EXTERNE';

export interface Employe {
  id: string;
  nom: string;
  role: string;
  brigade: string;
  phone: string;
  type: TypeEmploye;
  statut: StatutRH;
}