import { CurrencyPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { cardMeta } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { Order } from '../orders/order';
import { OrderService } from '../orders/order.service';
import { PICTURE_ACCEPT, pictureFileError } from '../shared/picture-file';
import { SiteHeader } from '../site-header/site-header';
import { UserService } from '../users/user.service';

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

  // A sold card can't be bought, except that it stays on screen for the buyer who just ordered it.
  protected readonly card = computed(() => {
    const card = this.listings().find((listing) => listing.cardId === this.cardId());
    return card && (!card.sold || this.order()) ? card : undefined;
  });
  protected readonly isOwn = computed(() => {
    const card = this.card();
    return card !== undefined && this.cards.isOwnListing(card);
  });
  // How the buyer reaches the seller to ask how to pay. undefined while loading or if the seller is gone.
  private readonly users = inject(UserService);
  protected readonly seller = toSignal(
    toObservable(computed(() => this.card()?.sellerName ?? null)).pipe(
      distinctUntilChanged(),
      switchMap((name) => (name ? this.users.getPublicProfile(name) : of(undefined)))
    )
  );
  // A preview address for the attached slip; the file itself is uploaded with the order.
  protected readonly slip = signal<string | null>(null);
  protected readonly errorMessage = signal('');
  protected readonly order = signal<Order | null>(null);
  protected readonly placing = signal(false);
  private slipFile: File | null = null;
  protected readonly pictureAccept = PICTURE_ACCEPT;
  protected readonly cardMeta = cardMeta;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.releaseSlip());
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
    this.slipFile = file;
    this.slip.set(URL.createObjectURL(file));
    this.errorMessage.set('');
  }

  protected confirm(): void {
    const card = this.card();
    const slip = this.slipFile;
    if (!card || this.isOwn() || this.order() || this.placing()) {
      return;
    }
    if (!slip) {
      this.errorMessage.set('Please attach your payment slip');
      return;
    }

    this.placing.set(true);
    this.errorMessage.set('');
    this.orders.placeOrder(card, slip).subscribe({
      next: (order) => {
        this.placing.set(false);
        this.order.set(order);
      },
      error: (error: Error) => {
        this.placing.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }

  private releaseSlip(): void {
    const slip = this.slip();
    if (slip) {
      URL.revokeObjectURL(slip);
      this.slip.set(null);
    }
    this.slipFile = null;
  }
}
