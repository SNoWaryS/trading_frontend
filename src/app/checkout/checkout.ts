import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { cardMeta } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { Order } from '../orders/order';
import { OrderService } from '../orders/order.service';
import { PICTURE_ACCEPT, pictureFileError } from '../shared/picture-file';
import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, RouterLink, SiteHeader],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout {
  private readonly cards = inject(CardService);
  private readonly orders = inject(OrderService);

  private readonly cardId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => Number(params.get('cardId')))),
    { initialValue: NaN }
  );
  private readonly listings = toSignal(this.cards.getListings(), { initialValue: [] });

  protected readonly card = computed(() => this.listings().find((card) => card.cardId === this.cardId()));
  protected readonly isOwn = computed(() => {
    const card = this.card();
    return card !== undefined && this.cards.isOwnListing(card);
  });
  protected readonly slip = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly order = signal<Order | null>(null);
  protected readonly pictureAccept = PICTURE_ACCEPT;
  protected readonly cardMeta = cardMeta;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (!this.order()) {
        this.releaseSlip();
      }
    });
  }

  protected chooseSlip(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const error = pictureFileError(file);
    if (error) {
      input.value = '';
      this.errorMessage.set(error);
      return;
    }

    this.releaseSlip();
    this.slip.set(URL.createObjectURL(file));
    this.errorMessage.set('');
  }

  protected confirm(): void {
    const card = this.card();
    const slip = this.slip();
    if (!card || this.isOwn() || this.order()) {
      return;
    }
    if (!slip) {
      this.errorMessage.set('Please attach your payment slip');
      return;
    }

    this.orders.placeOrder(card, slip).subscribe((order) => this.order.set(order));
  }

  private releaseSlip(): void {
    const slip = this.slip();
    if (slip) {
      URL.revokeObjectURL(slip);
      this.slip.set(null);
    }
  }
}
