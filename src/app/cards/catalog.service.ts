import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CatalogCard } from './card-catalog';

const SAMPLE_PICTURE = 'Frogg_login.jpg';

function entry(
  catalogId: number,
  cardElement: string,
  rarity: string,
  cardStage: string,
  referencePrice: number
): CatalogCard {
  const number = String(catalogId).padStart(3, '0');
  return {
    catalogId,
    cardName: `Sample Card ${String(catalogId).padStart(2, '0')}`,
    setName: 'Sample Set',
    cardNumber: `${number}/100`,
    cardType: 'Pokémon',
    rarity,
    cardStage,
    cardElement,
    cardPicture: SAMPLE_PICTURE,
    referencePrice,
  };
}

// Sample catalog until the real card list and reference prices are loaded into CARD_CATALOG.
// Entries 9 to 12 are not for sale yet, so the add card form has cards nobody is selling.
export const SAMPLE_CATALOG: CatalogCard[] = [
  entry(1, 'Water', 'AR', 'Basic', 1400),
  entry(2, 'Fire', 'SR', 'Stage 1', 2650),
  entry(3, 'Grass', 'R', 'Basic', 350),
  entry(4, 'Lightning', 'SAR', 'Stage 2', 9500),
  entry(5, 'Psychic', 'AR', 'Basic', 1590),
  entry(6, 'Water', 'RR', 'Stage 1', 720),
  entry(7, 'Fire', 'UR', 'Stage 2', 13000),
  entry(8, 'Grass', 'C', 'Basic', 60),
  entry(9, 'Fighting', 'SR', 'Stage 1', 2100),
  entry(10, 'Darkness', 'AR', 'Basic', 980),
  entry(11, 'Metal', 'R', 'Stage 2', 410),
  entry(12, 'Dragon', 'SAR', 'Stage 2', 7800),
];

@Injectable({ providedIn: 'root' })
export class CatalogService {
  // Sample data for now. Replace with an HttpClient call once the API exists.
  getCatalog(): Observable<CatalogCard[]> {
    return of(SAMPLE_CATALOG);
  }
}
