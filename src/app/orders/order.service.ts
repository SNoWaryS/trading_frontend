import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of, throwError } from 'rxjs';
import { CardListing } from '../cards/card-listing';
import { Order } from './order';

const SAMPLE_CURRENT_USER = 'seller1';

const SAMPLE_ORDERS: Order[] = [
  { orderId: 1, cardId: 7, buyerName: SAMPLE_CURRENT_USER, orderStatus: 'received', orderPrice: 12500, paymentSlip: null },
  { orderId: 2, cardId: 4, buyerName: SAMPLE_CURRENT_USER, orderStatus: 'shipped', orderPrice: 8900, paymentSlip: null },
  { orderId: 3, cardId: 5, buyerName: SAMPLE_CURRENT_USER, orderStatus: 'pending', orderPrice: 1590, paymentSlip: null },
  // Other buyers' orders for the sample user's cards, so the profile has reviews from buyers.
  // Note: these sample cards still show as for sale, because CARDS has no sold status yet.
  { orderId: 4, cardId: 3, buyerName: 'buyer2', orderStatus: 'received', orderPrice: 320, paymentSlip: null },
  { orderId: 5, cardId: 6, buyerName: 'buyer3', orderStatus: 'received', orderPrice: 680, paymentSlip: null },
  // Another buyer's order from seller2, so other sellers' profiles have a review too.
  { orderId: 6, cardId: 2, buyerName: 'buyer3', orderStatus: 'received', orderPrice: 2800, paymentSlip: null },
];

@Injectable({ providedIn: 'root' })
export class OrderService {
  // Orders held in memory for now. Replace these methods with HttpClient calls once the API exists.
  private readonly orders = new BehaviorSubject<Order[]>(SAMPLE_ORDERS);

  getOrders(): Observable<Order[]> {
    return this.orders.asObservable();
  }

  // Sample user for now. Use the logged-in user once the app has sessions.
  getMyOrders(): Observable<Order[]> {
    return this.orders.pipe(
      map((orders) => orders.filter((order) => order.buyerName === SAMPLE_CURRENT_USER))
    );
  }

  placeOrder(card: CardListing, paymentSlip: string): Observable<Order> {
    const current = this.orders.value;
    const order: Order = {
      orderId: Math.max(0, ...current.map((existing) => existing.orderId)) + 1,
      cardId: card.cardId,
      buyerName: SAMPLE_CURRENT_USER,
      orderStatus: 'pending',
      orderPrice: card.cardPrice,
      paymentSlip,
    };
    this.orders.next([...current, order]);
    return of(order);
  }

  // Only a shipped order can be marked as received.
  confirmReceipt(orderId: number): Observable<Order> {
    const order = this.orders.value.find((existing) => existing.orderId === orderId);
    if (!order || order.orderStatus !== 'shipped') {
      return throwError(() => new Error('This order cannot be marked as received'));
    }

    const received: Order = { ...order, orderStatus: 'received' };
    this.orders.next(this.orders.value.map((existing) => (existing.orderId === orderId ? received : existing)));
    return of(received);
  }
}
