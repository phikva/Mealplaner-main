import { groq } from 'next-sanity';

// Types for the query responses
export interface KostholdsbehovItem {
  navn: string;
  verdi: string;
  beskrivelse?: string;
}

export interface AllergiItem {
  navn: string;
  beskrivelse?: string;
  alvorlighetsgrad: 'mild' | 'moderate' | 'severe';
}

export interface KjokkenType {
  navn: string;
  beskrivelse?: string;
  region?: string;
  bildeUrl?: string;
}

export interface IngredientItem {
  navn: string;
  kategori: string;
  beskrivelse?: string;
}

export interface BrukerprofilData {
  kostholdsbehov: KostholdsbehovItem[];
  vanligeAllergier: AllergiItem[];
  kjokkenTyper: KjokkenType[];
  vanligeIngredienser: IngredientItem[];
}

// Query to get all profile settings
export const brukerprofilQuery = groq`*[_type == "brukerprofil"][0] {
  kostholdsbehov[] {
    navn,
    verdi,
    beskrivelse
  },
  vanligeAllergier[] {
    navn,
    beskrivelse,
    alvorlighetsgrad
  },
  kjokkenTyper[] {
    navn,
    beskrivelse,
    region,
    "bildeUrl": bilde.asset->url
  },
  vanligeIngredienser[] {
    navn,
    kategori,
    beskrivelse
  }
}`;

// Individual queries for specific sections
export const kostholdsbehovQuery = groq`*[_type == "brukerprofil"][0].kostholdsbehov[] {
  navn,
  verdi,
  beskrivelse
}`;

export const allergierQuery = groq`*[_type == "brukerprofil"][0].vanligeAllergier[] {
  navn,
  beskrivelse,
  alvorlighetsgrad
}`;

export const kjokkenTyperQuery = groq`*[_type == "brukerprofil"][0].kjokkenTyper[] {
  navn,
  beskrivelse,
  region,
  "bildeUrl": bilde.asset->url
}`;

export const ingredienserQuery = groq`*[_type == "brukerprofil"][0].vanligeIngredienser[] {
  navn,
  kategori,
  beskrivelse
}`; 