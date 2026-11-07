// Mirrors the CARD_CATALOG table: the cards that may be sold, with their reference price.
export interface CatalogCard {
  catalogId: number;
  cardName: string;
  setName: string | null;
  cardNumber: string | null;
  cardType: string;
  rarity: string;
  cardStage: string | null;
  cardElement: string | null;
  cardPicture: string | null;
  referencePrice: number | null;
}
