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
  cardPicture: string | null;
  cardDescription: string | null;
  sold: boolean;
}

export interface NewCardListing {
  catalogId: number;
  cardPrice: number;
  cardDescription: string | null;
  photo: File | null;
}

export type ListingChanges = Pick<CardListing, 'cardPrice' | 'cardDescription'>;

export function cardMeta(card: Pick<CardListing, 'rarity' | 'cardElement' | 'cardStage'>): string {
  return [card.rarity, card.cardElement, card.cardStage].filter((part) => part && part !== '-').join(' · ');
}

export interface SimilarCard {
  card: CardListing;
  similarity: number;
}

export interface SimilarSearch {
  basedOn: 'listings' | 'catalog' | 'none';
  matches: number;
  cards: SimilarCard[];
}
