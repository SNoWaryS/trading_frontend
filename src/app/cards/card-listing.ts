import { CatalogCard } from './card-catalog';

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
}

// What a seller enters when listing a card.
export interface NewCardListing {
  catalogId: number;
  cardPrice: number;
  cardPicture: string | null;
  cardDescription: string | null;
}

export function toListing(
  catalog: CatalogCard,
  listing: { cardId: number; sellerName: string } & Omit<NewCardListing, 'catalogId'>
): CardListing {
  return {
    cardId: listing.cardId,
    catalogId: catalog.catalogId,
    cardName: catalog.cardName,
    sellerName: listing.sellerName,
    cardType: catalog.cardType,
    rarity: catalog.rarity,
    referencePrice: catalog.referencePrice,
    cardPrice: listing.cardPrice,
    cardStage: catalog.cardStage,
    cardElement: catalog.cardElement,
    cardPicture: listing.cardPicture ?? catalog.cardPicture,
    cardDescription: listing.cardDescription,
  };
}

export function cardMeta(card: Pick<CardListing, 'rarity' | 'cardElement' | 'cardStage'>): string {
  // The catalog uses '-' for a card with no rarity.
  return [card.rarity, card.cardElement, card.cardStage].filter((part) => part && part !== '-').join(' · ');
}
