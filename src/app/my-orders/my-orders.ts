import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CardListing, cardMeta } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { OrderDetail } from '../order-detail/order-detail';
import { Order, ORDER_STATUS_LABELS } from '../orders/order';
import { OrderService } from '../orders/order.service';
import { OrdersTabs } from '../orders-tabs/orders-tabs';
import { ReviewForm } from '../review-form/review-form';
import { isReviewed, Review } from '../reviews/review';
import { ReviewService } from '../reviews/review.service';
import { SiteHeader } from '../site-header/site-header';

interface OrderRow {
  order: Order;
  card: CardListing;
  review: Review | null;
}

@Component({
  selector: 'app-my-orders',
  imports: [CurrencyPipe, OrderDetail, OrdersTabs, ReviewForm, RouterLink, SiteHeader],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css'
})
export class MyOrders {
  private readonly orders = toSignal(inject(OrderService).getMyOrders(), { initialValue: [] });
  private readonly listings = toSignal(inject(CardService).getListings(), { initialValue: [] });
  private readonly reviews = toSignal(inject(ReviewService).getReviews(), { initialValue: [] });

  protected readonly rows = computed<OrderRow[]>(() =>
    this.orders().flatMap((order) => {
        const card = this.listings().find((listing) => listing.cardId === order.cardId);
        const review = this.reviews().find((item) => item.orderId === order.orderId) ?? null;
        return card ? [{ order, card, review }] : [];
      })
  );

  private readonly selectedOrderId = signal<number | null>(null);
  protected readonly selected = computed(() => this.rows().find((row) => row.order.orderId === this.selectedOrderId()));

  protected readonly reviewingOrderId = signal<number | null>(null);
  protected readonly reviewing = computed(() => this.rows().find((row) => row.order.orderId === this.reviewingOrderId()));

  protected readonly statusLabels = ORDER_STATUS_LABELS;
  protected readonly cardMeta = cardMeta;
  protected readonly isReviewed = isReviewed;

  protected open(row: OrderRow): void {
    this.selectedOrderId.set(row.order.orderId);
  }

  protected closeDetail(): void {
    this.selectedOrderId.set(null);
  }

  protected startReview(row: OrderRow): void {
    this.reviewingOrderId.set(row.order.orderId);
  }
}
