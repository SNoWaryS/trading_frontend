import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { CardListing, NewCardListing } from './card-listing';

const SAMPLE_PICTURE = 'Frogg_login.jpg';
const SAMPLE_CURRENT_USER = 'seller1';

function sample(
  cardId: number,
  cardElement: string,
  rarity: string,
  cardStage: string,
  cardPrice: number,
  referencePrice: number,
  sellerName = `seller${cardId}`
): CardListing {
  return {
    cardId,
    cardName: `Sample Card ${String(cardId).padStart(2, '0')}`,
    sellerName,
    cardType: 'Pokémon',
    rarity,
    referencePrice,
    cardPrice,
    cardStage,
    cardElement,
    cardPicture: SAMPLE_PICTURE,
    cardDescription: `Sample description for a ${rarity} ${cardElement} card. The seller's own notes will appear here.`,
  };
}

const SAMPLE_LISTINGS: CardListing[] = [
  sample(1, 'Water', 'AR', 'Basic', 1250, 1400),
  sample(2, 'Fire', 'SR', 'Stage 1', 2800, 2650),
  sample(3, 'Grass', 'R', 'Basic', 320, 350, SAMPLE_CURRENT_USER),
  sample(4, 'Lightning', 'SAR', 'Stage 2', 8900, 9500),
  sample(5, 'Psychic', 'AR', 'Basic', 1590, 1590),
  sample(6, 'Water', 'RR', 'Stage 1', 680, 720, SAMPLE_CURRENT_USER),
  sample(7, 'Fire', 'UR', 'Stage 2', 12500, 13000),
  sample(8, 'Grass', 'C', 'Basic', 45, 60),
];

@Injectable({ providedIn: 'root' })
export class CardService {
  // Sample data held in memory for now. Replace these methods with HttpClient calls once the API exists.
  private readonly listings = new BehaviorSubject(SAMPLE_LISTINGS);

  getListings(): Observable<CardListing[]> {
    return this.listings.asObservable();
  }

  // Sample user for now. Use the logged-in user once the app has sessions.
  getMyListings(): Observable<CardListing[]> {
    return this.listings.pipe(
      map((listings) => listings.filter((card) => card.sellerName === SAMPLE_CURRENT_USER))
    );
  }

  addListing(card: NewCardListing): Observable<CardListing> {
    const current = this.listings.value;
    const listing: CardListing = {
      ...card,
      cardId: Math.max(0, ...current.map((existing) => existing.cardId)) + 1,
      sellerName: SAMPLE_CURRENT_USER,
    };
    this.listings.next([listing, ...current]);
    return of(listing);
  }
}
