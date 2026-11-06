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

export function matchesCatalogSearch(card: CatalogCard, term: string): boolean {
  const query = term.trim().toLowerCase();
  return (
    !query ||
    [card.cardName, card.setName, card.cardNumber].some((value) => value?.toLowerCase().includes(query))
  );
}
