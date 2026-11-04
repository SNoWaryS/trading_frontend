import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AddCard } from '../add-card/add-card';
import { cardMeta } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { SiteHeader } from '../site-header/site-header';

@Component({
  selector: 'app-sell',
  imports: [AddCard, CurrencyPipe, SiteHeader],
  templateUrl: './sell.html',
  styleUrl: './sell.css'
})
export class Sell {
  protected readonly listings = toSignal(inject(CardService).getMyListings(), { initialValue: [] });
  protected readonly adding = signal(false);
  protected readonly cardMeta = cardMeta;
}
