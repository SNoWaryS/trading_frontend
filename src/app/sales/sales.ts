import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { CardListing, cardMeta } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { ORDER_STATUS_LABELS, Sale } from '../orders/order';
import { OrderService } from '../orders/order.service';
import { OrdersTabs } from '../orders-tabs/orders-tabs';
import { SiteHeader } from '../site-header/site-header';

interface SaleRow {
  sale: Sale;
  card: CardListing;
}

@Component({
  selector: 'app-sales',
  imports: [CurrencyPipe, OrdersTabs, SiteHeader],
  templateUrl: './sales.html',
  styleUrl: './sales.css'
})
export class Sales {
  private readonly orders = inject(OrderService);
  private readonly sales = toSignal(this.orders.getSales(), { initialValue: [] });
  private readonly listings = toSignal(inject(CardService).getListings(), { initialValue: [] });

  protected readonly rows = computed<SaleRow[]>(() =>
    this.sales().flatMap((sale) => {
      const card = this.listings().find((listing) => listing.cardId === sale.cardId);
      return card ? [{ sale, card }] : [];
    })
  );
  protected readonly toShip = computed(() => this.sales().filter((sale) => sale.orderStatus === 'pending').length);

  protected readonly busyId = signal<number | null>(null);
  protected readonly error = signal<{ orderId: number; message: string } | null>(null);
  protected readonly statusLabels = ORDER_STATUS_LABELS;
  protected readonly cardMeta = cardMeta;

  protected cancel(row: SaleRow): void {
    if (!confirm(`Cancel ${row.sale.buyerName}'s order for ${row.card.cardName}? The card goes back on sale.`)) {
      return;
    }
    this.run(row, this.orders.cancelOrder(row.sale.orderId));
  }

  protected ship(row: SaleRow): void {
    if (!confirm(`Have you checked the payment and sent ${row.card.cardName} to ${row.sale.buyerName}?`)) {
      return;
    }
    this.run(row, this.orders.shipOrder(row.sale.orderId));
  }

  private run(row: SaleRow, request: Observable<unknown>): void {
    this.busyId.set(row.sale.orderId);
    this.error.set(null);
    request.subscribe({
      next: () => this.busyId.set(null),
      error: (error: Error) => {
        this.busyId.set(null);
        this.error.set({ orderId: row.sale.orderId, message: error.message });
      },
    });
  }
}
