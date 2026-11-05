import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CardListing, cardMeta } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { OrderDetail } from '../order-detail/order-detail';
import { Order, ORDER_STATUS_LABELS } from '../orders/order';
import { OrderService } from '../orders/order.service';
import { SiteHeader } from '../site-header/site-header';

interface OrderRow {
  order: Order;
  card: CardListing;
}

@Component({
  selector: 'app-my-orders',
  imports: [CurrencyPipe, OrderDetail, RouterLink, SiteHeader],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css'
})
export class MyOrders {
  private readonly orders = toSignal(inject(OrderService).getMyOrders(), { initialValue: [] });
  private readonly listings = toSignal(inject(CardService).getListings(), { initialValue: [] });

  // Newest first. Cards are never removed from the sample data, so every order has its card.
  protected readonly rows = computed<OrderRow[]>(() =>
    [...this.orders()]
      .reverse()
      .flatMap((order) => {
        const card = this.listings().find((listing) => listing.cardId === order.cardId);
        return card ? [{ order, card }] : [];
      })
  );

  private readonly selectedOrderId = signal<number | null>(null);
  protected readonly selected = computed(() => this.rows().find((row) => row.order.orderId === this.selectedOrderId()));

  protected readonly statusLabels = ORDER_STATUS_LABELS;
  protected readonly cardMeta = cardMeta;

  protected open(row: OrderRow): void {
    this.selectedOrderId.set(row.order.orderId);
  }

  protected closeDetail(): void {
    this.selectedOrderId.set(null);
  }
}
