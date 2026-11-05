import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CardDetail } from '../card-detail/card-detail';
import { CardListing, cardMeta } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'app-home',
  imports: [CardDetail, CurrencyPipe, RouterLink, SiteHeader],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private readonly cards = inject(CardService);
  private readonly router = inject(Router);
  private readonly listings = toSignal(this.cards.getListings(), { initialValue: [] });

  protected readonly search = signal('');
  protected readonly selectedElement = signal<string | null>(null);
  protected readonly selectedCard = signal<CardListing | null>(null);
  protected readonly cardMeta = cardMeta;

  protected readonly elements = computed(() => [
    ...new Set(this.listings().flatMap((card) => (card.cardElement ? [card.cardElement] : []))),
  ]);

  protected readonly visibleListings = computed(() => {
    const term = this.search().trim().toLowerCase();
    const element = this.selectedElement();
    return this.listings().filter(
      (card) =>
        (!term || card.cardName.toLowerCase().includes(term)) &&
        (!element || card.cardElement === element)
    );
  });

  protected isOwn(card: CardListing): boolean {
    return this.cards.isOwnListing(card);
  }

  protected buy(card: CardListing): void {
    this.router.navigate(['/checkout', card.cardId]);
  }
}
