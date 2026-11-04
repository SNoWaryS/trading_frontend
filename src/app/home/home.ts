import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CardService } from '../cards/card.service';
import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe, RouterLink, SiteHeader],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private readonly listings = toSignal(inject(CardService).getListings(), { initialValue: [] });

  protected readonly search = signal('');
  protected readonly selectedElement = signal<string | null>(null);

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
}
