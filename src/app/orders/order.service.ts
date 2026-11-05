import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CardListing } from '../cards/card-listing';
import { Order } from './order';

const SAMPLE_CURRENT_USER = 'seller1';

@Injectable({ providedIn: 'root' })
export class OrderService {
  // Orders held in memory for now. Replace these methods with HttpClient calls once the API exists.
  private readonly orders = new BehaviorSubject<Order[]>([]);

  getOrders(): Observable<Order[]> {
    return this.orders.asObservable();
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
}
