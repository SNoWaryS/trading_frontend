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
