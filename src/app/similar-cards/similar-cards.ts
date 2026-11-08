import { CurrencyPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { CardListing, cardMeta, SimilarSearch } from '../cards/card-listing';
import { CardService } from '../cards/card.service';

// How long to wait after the last key before asking the API, so typing a name sends one request, not one per letter.
export const SIMILAR_SEARCH_DELAY_MS = 300;

// The API's answer, with the search it answers, so the heading does not change while the user is still typing.
type Result = SimilarSearch & { term: string };

// Under the Home page's search results: cards for sale most like what was searched for, found by vector similarity
// on the API. When no card with that name is for sale, the API matches the catalog instead and says so.
// Shows nothing for an empty search, when there are no suggestions, or when they cannot be loaded.
@Component({
  selector: 'app-similar-cards',
  imports: [CurrencyPipe, PercentPipe],
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
