// Mirrors the ORDERS table. buyerName and paymentSlip are not in the database yet.
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
