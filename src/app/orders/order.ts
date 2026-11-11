export type OrderStatus = 'pending' | 'shipped' | 'received' | 'cancelled';

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
  cancelled: 'Cancelled',
};

export interface BuyerContact {
  name: string;
  surname: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
}

export interface Sale extends Order {
  buyer: BuyerContact;
}
