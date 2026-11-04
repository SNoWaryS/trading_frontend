// Mirrors the CARDS table. cardName and sellerName are not in the database yet.
export interface CardListing {
  cardId: number;
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
}

export type NewCardListing = Omit<CardListing, 'cardId' | 'sellerName'>;

export function cardMeta(card: CardListing): string {
  return [card.rarity, card.cardElement, card.cardStage].filter(Boolean).join(' · ');
}
