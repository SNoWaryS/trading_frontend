// One row of CARDS joined with its CARD_CATALOG card, as the pages show it.
// The card details and reference price come from the catalog; the seller sets the price, photo and description.
// sellerName comes from USERS through seller_id.
export interface CardListing {
  cardId: number;
  catalogId: number;
  cardName: string;
  sellerName: string;
  cardType: string;
  rarity: string;
  referencePrice: number | null;
  cardPrice: number;
  cardStage: string | null;
  cardElement: string | null;
  cardPicture: string | null; // the seller's photo, or the catalog picture when they did not add one
  cardDescription: string | null;
  sold: boolean; // someone has ordered it, so it is no longer for sale
}

// What a seller enters when listing a card. The photo is uploaded with it; without one, the catalog picture is shown.
export interface NewCardListing {
  catalogId: number;
  cardPrice: number;
  cardDescription: string | null;
  photo: File | null;
}

// What a seller can change on a card they are selling.
export type ListingChanges = Pick<CardListing, 'cardPrice' | 'cardDescription'>;

export function cardMeta(card: Pick<CardListing, 'rarity' | 'cardElement' | 'cardStage'>): string {
  // The catalog uses '-' for a card with no rarity.
  return [card.rarity, card.cardElement, card.cardStage].filter((part) => part && part !== '-').join(' · ');
}

// A card for sale and how alike it is to a search, from 0 to 1 (see back/trading_backend/CardVectors.cs).
export interface SimilarCard {
  card: CardListing;
  similarity: number;
}

// Cards like a search on the Home page. basedOn says where the search vector came from: 'listings' (cards for sale
// whose name matched), 'catalog' (none for sale, so catalog cards whose name matched) or 'none' (nothing matched).
export interface SimilarSearch {
  basedOn: 'listings' | 'catalog' | 'none';
  matches: number;
  cards: SimilarCard[];
}
