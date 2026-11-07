import { inject, Injectable, Provider } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CatalogCard } from '../cards/card-catalog';
import { CardListing, ListingChanges, NewCardListing } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { provideSampleOrders } from './sample-orders';
import { provideSampleUsers } from './sample-users';

// For tests: listings held in memory instead of the listings API, with the same sample cards the database seed
// (back/seed_sample_listings.sql) uses for card ids 1 to 8. The sample orders and reviews refer to these ids.

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

// The catalog cards the sample listings sell.
export const SAMPLE_CATALOG: CatalogCard[] = [
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
  return toListing(catalog, cardId, sellerName, {
    catalogId: cardId,
    cardPrice,
    photo: null,
    cardDescription: `Sample description for a ${catalog.rarity} ${catalog.cardElement} card. The seller's own notes will appear here.`,
  });
}

// Sample listings: listing N sells catalog card N.
export const SAMPLE_LISTINGS: CardListing[] = [
  sample(1, 1250),
  sample(2, 2800),
  sample(3, 320, SAMPLE_COLLECTOR),
  sample(4, 8900),
  sample(5, 1590),
  sample(6, 680, SAMPLE_COLLECTOR),
  sample(7, 12500),
  sample(8, 45),
];


function toListing(catalog: CatalogCard, cardId: number, sellerName: string, card: NewCardListing): CardListing {
  return {
    cardId,
    catalogId: catalog.catalogId,
    cardName: catalog.cardName,
    sellerName,
    cardType: catalog.cardType,
    rarity: catalog.rarity,
    referencePrice: catalog.referencePrice,
    cardPrice: card.cardPrice,
    cardStage: catalog.cardStage,
    cardElement: catalog.cardElement,
    // The API stores an uploaded photo and answers with its address; here the address is made up from the name.
    cardPicture: card.photo ? `uploaded:${card.photo.name}` : catalog.cardPicture,
    cardDescription: card.cardDescription,
    // Every sample card shows as for sale here, so tests see all of them.
    sold: false,
  };
}

@Injectable()
export class SampleCardService implements Pick<CardService, keyof CardService> {
  private readonly auth = inject(AuthService);
  private readonly listings = new BehaviorSubject(SAMPLE_LISTINGS);

  getListings(): Observable<CardListing[]> {
    return this.listings.asObservable();
  }

  getMyListings(): Observable<CardListing[]> {
    return combineLatest([this.listings, this.auth.user$]).pipe(
      map(([listings, user]) => listings.filter((card) => card.sellerName === user?.username))
    );
  }

  isOwnListing(card: CardListing): boolean {
    return card.sellerName === this.auth.username();
  }

  // Only the sample catalog cards can be listed here.
  addListing(card: NewCardListing): Observable<CardListing> {
    const sellerName = this.auth.username();
    const catalog = SAMPLE_CATALOG.find((entry) => entry.catalogId === card.catalogId);
    if (!catalog) {
      return throwError(() => new Error('This card is not in the catalog'));
    }
    if (!sellerName) {
      return throwError(() => new Error('Please log in to sell a card'));
    }
    const current = this.listings.value;
    const listing = toListing(catalog, Math.max(0, ...current.map((existing) => existing.cardId)) + 1, sellerName, card);
    this.listings.next([listing, ...current]);
    return of(listing);
  }

  updateListing(cardId: number, changes: ListingChanges): Observable<CardListing> {
    const listing = this.listings.value.find((card) => card.cardId === cardId && this.isOwnListing(card));
    if (!listing) {
      return throwError(() => new Error('You have no such card for sale'));
    }
    const updated = { ...listing, ...changes };
    this.listings.next(this.listings.value.map((card) => (card === listing ? updated : card)));
    return of(updated);
  }

  markSold(cardId: number): void {
    this.listings.next(this.listings.value.map((card) => (card.cardId === cardId ? { ...card, sold: true } : card)));
  }

  removeListing(cardId: number): Observable<void> {
    const listing = this.listings.value.find((card) => card.cardId === cardId && this.isOwnListing(card));
    if (!listing) {
      return throwError(() => new Error('You have no such card for sale'));
    }
    this.listings.next(this.listings.value.filter((card) => card !== listing));
    return of(undefined);
  }
}

// Sample cards, orders, reviews and users in memory.
export function provideSampleCards(): Provider[] {
  return [{ provide: CardService, useClass: SampleCardService }, ...provideSampleOrders(), ...provideSampleUsers()];
}
