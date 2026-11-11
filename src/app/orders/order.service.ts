import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, filter, Observable, tap, throwError } from 'rxjs';
import { API_URL } from '../api';
import { CardListing } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { Order, Sale } from './order';

const ORDERS_URL = `${API_URL}/api/orders`;

function apiError(fallback: string) {
  return (error: HttpErrorResponse) =>
    throwError(() => new Error(typeof error.error?.message === 'string' ? error.error.message : fallback));
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly cards = inject(CardService);
  private readonly mine = new BehaviorSubject<Order[] | null>(null);
  private readonly sales = new BehaviorSubject<Sale[] | null>(null);

  getMyOrders(): Observable<Order[]> {
    this.reload(`${ORDERS_URL}/mine`, this.mine);
    return this.mine.pipe(filter((orders): orders is Order[] => orders !== null));
  }

  getSales(): Observable<Sale[]> {
    this.reload(`${ORDERS_URL}/sales`, this.sales);
    return this.sales.pipe(filter((sales): sales is Sale[] => sales !== null));
  }

  placeOrder(card: CardListing, slip: File): Observable<Order> {
    const form = new FormData();
    form.set('cardId', String(card.cardId));
    form.set('slip', slip);
    return this.http.post<Order>(ORDERS_URL, form).pipe(
      tap((order) => {
        this.mine.next([order, ...(this.mine.value ?? [])]);
        this.cards.markSold(card.cardId);
      }),
      catchError(apiError('Cannot place this order right now. Please try again.'))
    );
  }

  shipOrder(orderId: number): Observable<Order> {
    return this.http.post<Order>(`${ORDERS_URL}/${orderId}/ship`, null).pipe(
      tap((order) =>
        this.sales.next(
          (this.sales.value ?? []).map((sale) => (sale.orderId === orderId ? { ...sale, orderStatus: order.orderStatus } : sale))
        )
      ),
      catchError(apiError('Cannot update this order right now. Please try again.'))
    );
  }

  confirmReceipt(orderId: number): Observable<Order> {
    return this.http.post<Order>(`${ORDERS_URL}/${orderId}/receive`, null).pipe(
      tap((order) => this.mine.next((this.mine.value ?? []).map((item) => (item.orderId === orderId ? order : item)))),
      catchError(apiError('This order cannot be marked as received yet.'))
    );
  }

  cancelOrder(orderId: number): Observable<Order> {
    return this.http.post<Order>(`${ORDERS_URL}/${orderId}/cancel`, null).pipe(
      tap((order) => {
        this.mine.next(this.mine.value?.map((item) => (item.orderId === orderId ? order : item)) ?? null);
        this.sales.next(
          this.sales.value?.map((sale) => (sale.orderId === orderId ? { ...sale, orderStatus: order.orderStatus } : sale)) ??
            null
        );
        this.cards.markAvailable(order.cardId);
      }),
      catchError(apiError('Cannot cancel this order right now. Please try again.'))
    );
  }

  private reload<T>(url: string, store: BehaviorSubject<T[] | null>): void {
    this.http.get<T[]>(url).subscribe({
      next: (items) => store.next(items),
      error: () => store.next(store.value ?? []),
    });
  }
}
