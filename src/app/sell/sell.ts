import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddCard } from '../add-card/add-card';
import { CardListing, cardMeta } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { SiteHeader } from '../site-header/site-header';

const MAX_PRICE = 9_999_999_999;

interface CardError {
  cardId: number;
  message: string;
}

@Component({
  selector: 'app-sell',
  imports: [AddCard, CurrencyPipe, ReactiveFormsModule, SiteHeader],
  templateUrl: './sell.html',
  styleUrl: './sell.css'
})
export class Sell {
  private readonly cards = inject(CardService);

  protected readonly listings = toSignal(this.cards.getMyListings(), { initialValue: [] });
  protected readonly forSale = computed(() => this.listings().filter((card) => !card.sold).length);
  protected readonly adding = signal(false);
  protected readonly cardMeta = cardMeta;

  protected readonly editingId = signal<number | null>(null);
  protected readonly busyId = signal<number | null>(null);
  protected readonly cardError = signal<CardError | null>(null);
  protected readonly editForm = new FormGroup({
    cardPrice: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(MAX_PRICE),
      Validators.pattern(/^\d+$/),
    ]),
    cardDescription: new FormControl('', { nonNullable: true }),
  });

  protected errorFor(card: CardListing): string | null {
    const error = this.cardError();
    return error?.cardId === card.cardId ? error.message : null;
  }

  protected edit(card: CardListing): void {
    this.editForm.setValue({ cardPrice: card.cardPrice, cardDescription: card.cardDescription ?? '' });
    this.cardError.set(null);
    this.editingId.set(card.cardId);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.cardError.set(null);
  }

  protected save(card: CardListing): void {
    const { cardPrice, cardDescription } = this.editForm.controls;
    if (cardPrice.invalid) {
      const message = cardPrice.hasError('required')
        ? 'Please enter your price'
        : 'Price must be a whole number from 1 to 9,999,999,999';
      this.cardError.set({ cardId: card.cardId, message });
      return;
    }

    this.busyId.set(card.cardId);
    this.cards
      .updateListing(card.cardId, {
        cardPrice: Number(cardPrice.value),
        cardDescription: cardDescription.value.trim() || null,
      })
      .subscribe({
        next: () => {
          this.busyId.set(null);
          this.editingId.set(null);
          this.cardError.set(null);
        },
        error: (error: Error) => {
          this.busyId.set(null);
          this.cardError.set({ cardId: card.cardId, message: error.message });
        },
      });
  }

  protected remove(card: CardListing): void {
    if (!confirm(`Remove ${card.cardName} from sale?`)) {
      return;
    }

    this.busyId.set(card.cardId);
    this.cardError.set(null);
    this.cards.removeListing(card.cardId).subscribe({
      next: () => this.busyId.set(null),
      error: (error: Error) => {
        this.busyId.set(null);
        this.cardError.set({ cardId: card.cardId, message: error.message });
      },
    });
  }
}
