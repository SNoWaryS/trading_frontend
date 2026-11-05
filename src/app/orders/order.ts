// Mirrors the ORDERS table. buyerName and paymentSlip are not in the database yet.
export interface Order {
  orderId: number;
  cardId: number;
  buyerName: string;
  orderStatus: 'pending';
  orderPrice: number;
  paymentSlip: string;
}
