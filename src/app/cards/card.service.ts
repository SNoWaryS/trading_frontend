import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of, throwError } from 'rxjs';
import { CardListing, NewCardListing, toListing } from './card-listing';
import { SAMPLE_CATALOG } from './catalog.service';

const SAMPLE_CURRENT_USER = 'seller1';

function sample(cardId: number, cardPrice: number, sellerName = `seller${cardId}`): CardListing {
  const catalog = SAMPLE_CATALOG.find((card) => card.catalogId === cardId)!;
  return toListing(catalog, {
    cardId,
    sellerName,
    cardPrice,
    cardPicture: null,
    cardDescription: `Sample description for a ${catalog.rarity} ${catalog.cardElement} card. The seller's own notes will appear here.`,
  });
}

// Sample listings: listing N sells catalog card N.
const SAMPLE_LISTINGS: CardListing[] = [
  sample(1, 1250),
  sample(2, 2800),
  sample(3, 320, SAMPLE_CURRENT_USER),
  sample(4, 8900),
  sample(5, 1590),
  sample(6, 680, SAMPLE_CURRENT_USER),
  sample(7, 12500),
  sample(8, 45),
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

  isOwnListing(card: CardListing): boolean {
    return card.sellerName === SAMPLE_CURRENT_USER;
  }

  // Only cards in the catalog can be listed. The API must check this too.
  addListing(card: NewCardListing): Observable<CardListing> {
    const catalog = SAMPLE_CATALOG.find((entry) => entry.catalogId === card.catalogId);
    if (!catalog) {
      return throwError(() => new Error('This card is not in the catalog'));
    }

    const current = this.listings.value;
    const listing = toListing(catalog, {
      ...card,
      cardId: Math.max(0, ...current.map((existing) => existing.cardId)) + 1,
      sellerName: SAMPLE_CURRENT_USER,
    });
    this.listings.next([listing, ...current]);
    return of(listing);
  }
}
