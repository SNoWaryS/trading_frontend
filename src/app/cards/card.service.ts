import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CardListing, NewCardListing, toListing } from './card-listing';
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

// The catalog cards the sample listings sell. Listings are still sample data until the listings API exists;
// the add card form searches the real catalog through the API.
const SAMPLE_CATALOG: CatalogCard[] = [
  entry(1, 'Water', 'AR', 'Basic', 1400),
  entry(2, 'Fire', 'SR', 'Stage 1', 2650),
  entry(3, 'Grass', 'R', 'Basic', 350),
  entry(4, 'Lightning', 'SAR', 'Stage 2', 9500),
  entry(5, 'Psychic', 'AR', 'Basic', 1590),
  entry(6, 'Water', 'RR', 'Stage 1', 720),
  entry(7, 'Fire', 'UR', 'Stage 2', 13000),
  entry(8, 'Grass', 'C', 'Basic', 60),
];

// The sample seller who owns listings 1, 3 and 6. Log in as seller1 to see them as your own.
const SAMPLE_COLLECTOR = 'seller1';

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
  sample(3, 320, SAMPLE_COLLECTOR),
  sample(4, 8900),
  sample(5, 1590),
  sample(6, 680, SAMPLE_COLLECTOR),
  sample(7, 12500),
  sample(8, 45),
];

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly auth = inject(AuthService);

  // Sample data held in memory for now. Replace these methods with HttpClient calls once the API exists.
  private readonly listings = new BehaviorSubject(SAMPLE_LISTINGS);

  getListings(): Observable<CardListing[]> {
    return this.listings.asObservable();
  }

  // The logged-in user's listings.
  getMyListings(): Observable<CardListing[]> {
    return combineLatest([this.listings, this.auth.user$]).pipe(
      map(([listings, user]) => listings.filter((card) => card.sellerName === user?.username))
    );
  }

  isOwnListing(card: CardListing): boolean {
    return card.sellerName === this.auth.username();
  }

  // Only cards in the catalog can be listed: `catalog` is the card the seller chose from the catalog API.
  // The listings API must check catalog_id too.
  addListing(card: NewCardListing, catalog: CatalogCard): Observable<CardListing> {
    const sellerName = this.auth.username();
    if (catalog.catalogId !== card.catalogId) {
      return throwError(() => new Error('This card is not in the catalog'));
    }
    if (!sellerName) {
      return throwError(() => new Error('Please log in to sell a card'));
    }

    const current = this.listings.value;
    const listing = toListing(catalog, {
      ...card,
      cardId: Math.max(0, ...current.map((existing) => existing.cardId)) + 1,
      sellerName,
    });
    this.listings.next([listing, ...current]);
    return of(listing);
  }
}
