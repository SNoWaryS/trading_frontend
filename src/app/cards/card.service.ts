import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CardListing } from './card-listing';

const SAMPLE_PICTURE = 'Frogg_login.jpg';

function sample(
  cardId: number,
  cardElement: string,
  rarity: string,
  cardStage: string,
  cardPrice: number,
  referencePrice: number
): CardListing {
  return {
    cardId,
    cardName: `Sample Card ${String(cardId).padStart(2, '0')}`,
    sellerName: `seller${cardId}`,
    cardType: 'Pokémon',
    rarity,
    referencePrice,
    cardPrice,
    cardStage,
    cardElement,
    cardPicture: SAMPLE_PICTURE,
    cardDescription: null,
  };
}

const SAMPLE_LISTINGS: CardListing[] = [
  sample(1, 'Water', 'AR', 'Basic', 1250, 1400),
  sample(2, 'Fire', 'SR', 'Stage 1', 2800, 2650),
  sample(3, 'Grass', 'R', 'Basic', 320, 350),
  sample(4, 'Lightning', 'SAR', 'Stage 2', 8900, 9500),
  sample(5, 'Psychic', 'AR', 'Basic', 1590, 1590),
  sample(6, 'Water', 'RR', 'Stage 1', 680, 720),
  sample(7, 'Fire', 'UR', 'Stage 2', 12500, 13000),
  sample(8, 'Grass', 'C', 'Basic', 45, 60),
];

@Injectable({ providedIn: 'root' })
export class CardService {
  // Sample data for now. Replace the body with an HttpClient call once the API exists.
  getListings(): Observable<CardListing[]> {
    return of(SAMPLE_LISTINGS);
  }
}
