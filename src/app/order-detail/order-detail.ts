import { CurrencyPipe } from '@angular/common';
import { afterNextRender, Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, switchMap } from 'rxjs';
import { CardListing, cardMeta } from '../cards/card-listing';
import { Order, ORDER_STATUS_LABELS } from '../orders/order';
import { OrderService } from '../orders/order.service';
import { isReviewed, Review } from '../reviews/review';
import { UserService } from '../users/user.service';

@Component({
  selector: 'app-order-detail',
  imports: [CurrencyPipe],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetail {
  readonly order = input.required<Order>();
  readonly card = input.required<CardListing>();
  readonly review = input<Review | null>(null);
  readonly closed = output<void>();

  private readonly orders = inject(OrderService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  private readonly users = inject(UserService);
  // So the buyer can reach the seller, for example about a refund after a cancelled order.
  protected readonly seller = toSignal(
    toObservable(this.card).pipe(
      map((card) => card.sellerName),
      distinctUntilChanged(),
      switchMap((name) => this.users.getPublicProfile(name))
    )
  );

  protected readonly asking = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly statusLabels = ORDER_STATUS_LABELS;
  protected readonly isReviewed = isReviewed;
  protected readonly cardMeta = cardMeta;

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected confirmReceipt(): void {
    this.orders.confirmReceipt(this.order().orderId).subscribe({
      next: () => {
        this.asking.set(false);
        this.errorMessage.set('');
      },
      error: () => {
        this.asking.set(false);
        this.errorMessage.set('This order cannot be marked as received yet.');
      },
    });
  }

  protected cancel(): void {
    if (!confirm(`Cancel your order for ${this.card().cardName}? If you have already paid, contact the seller about a refund.`)) {
      return;
    }
    this.cancelling.set(true);
    this.errorMessage.set('');
    this.orders.cancelOrder(this.order().orderId).subscribe({
      next: () => this.cancelling.set(false),
      error: (error: Error) => {
        this.cancelling.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }

  protected close(): void {
    this.dialog().nativeElement.close();
    this.closed.emit();
  }

  // A click on the dialog element itself, not its content, is a click on the backdrop.
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
