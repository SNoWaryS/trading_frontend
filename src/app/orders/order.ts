// Mirrors the ORDERS table. buyerName comes from USERS through user_id.
// paymentSlip is the address of the slip picture on the API, which only the buyer and the seller can open.
// pending: the seller has not checked the payment yet. shipped: the seller sent the card.
// received: the buyer confirmed the card arrived, which unlocks the review.
export type OrderStatus = 'pending' | 'shipped' | 'received';

export interface Order {
  orderId: number;
  cardId: number;
  buyerName: string;
  orderStatus: OrderStatus;
  orderPrice: number;
  paymentSlip: string | null;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Waiting for payment check',
  shipped: 'Shipped',
  received: 'Received',
};

// What the seller needs to send the card: the buyer's contact details and address.
export interface BuyerContact {
  name: string;
  surname: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
}

// An order for one of the logged-in user's cards.
export interface Sale extends Order {
  buyer: BuyerContact;
}
