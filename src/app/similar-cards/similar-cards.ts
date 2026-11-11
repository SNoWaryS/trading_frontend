import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { CardListing, cardMeta, SimilarSearch } from '../cards/card-listing';
import { CardService } from '../cards/card.service';

export const SIMILAR_SEARCH_DELAY_MS = 300;

type Result = SimilarSearch & { term: string };

@Component({
  selector: 'app-similar-cards',
  imports: [CurrencyPipe],
  templateUrl: './similar-cards.html',
  styleUrl: './similar-cards.css'
})
export class SimilarCards {
  readonly search = input.required<string>();
  readonly element = input<string | null>(null);
  readonly open = output<CardListing>();

  private readonly cards = inject(CardService);
  private readonly query = computed(() => ({ search: this.search().trim(), element: this.element() }));

  protected readonly result = toSignal(
    toObservable(this.query).pipe(
      debounceTime(SIMILAR_SEARCH_DELAY_MS),
      distinctUntilChanged((a, b) => a.search === b.search && a.element === b.element),
      switchMap(({ search, element }) =>
        search
          ? this.cards.getSimilar(search, element).pipe(
              map((result): Result | null => ({ ...result, term: search })),
              catchError(() => of(null))
            )
          : of(null)
      )
    ),
    { initialValue: null }
  );
  protected readonly cardMeta = cardMeta;
}
