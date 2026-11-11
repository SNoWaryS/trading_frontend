import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, filter, map, Observable, tap, throwError } from 'rxjs';
import { API_URL } from '../api';
import { AuthService } from '../auth/auth.service';
import { CardListing, ListingChanges, NewCardListing, SimilarSearch } from './card-listing';

const LISTINGS_URL = `${API_URL}/api/listings`;

function apiError(fallback: string) {
  return (error: HttpErrorResponse) =>
    throwError(() => new Error(typeof error.error?.message === 'string' ? error.error.message : fallback));
}

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly listings = new BehaviorSubject<CardListing[] | null>(null);
  private loading = false;

  getListings(): Observable<CardListing[]> {
    this.load();
    return this.listings.pipe(filter((listings): listings is CardListing[] => listings !== null));
  }

  getMyListings(): Observable<CardListing[]> {
    return combineLatest([this.getListings(), this.auth.user$]).pipe(
      map(([listings, user]) => listings.filter((card) => card.sellerName === user?.username))
    );
  }

  isOwnListing(card: CardListing): boolean {
    return card.sellerName === this.auth.username();
  }

  getSimilar(search: string, element: string | null): Observable<SimilarSearch> {
    const params: Record<string, string> = element ? { search, element } : { search };
    return this.http.get<SimilarSearch>(`${LISTINGS_URL}/similar`, { params });
  }

  addListing(card: NewCardListing): Observable<CardListing> {
    const form = new FormData();
    form.set('catalogId', String(card.catalogId));
    form.set('cardPrice', String(card.cardPrice));
    form.set('cardDescription', card.cardDescription ?? '');
    if (card.photo) {
      form.set('photo', card.photo);
    }
    return this.http.post<CardListing>(LISTINGS_URL, form).pipe(
      tap((listing) => this.listings.next([listing, ...(this.listings.value ?? [])])),
      catchError(apiError('Cannot list this card right now. Please try again.'))
    );
  }

  updateListing(cardId: number, changes: ListingChanges): Observable<CardListing> {
    return this.http.put<CardListing>(`${LISTINGS_URL}/${cardId}`, changes).pipe(
      tap((updated) =>
        this.listings.next((this.listings.value ?? []).map((card) => (card.cardId === cardId ? updated : card)))
      ),
      catchError(apiError('Cannot save this card right now. Please try again.'))
    );
  }

  removeListing(cardId: number): Observable<void> {
    return this.http.delete<void>(`${LISTINGS_URL}/${cardId}`).pipe(
      tap(() => this.listings.next((this.listings.value ?? []).filter((card) => card.cardId !== cardId))),
      catchError(apiError('Cannot remove this card right now. Please try again.'))
    );
  }

  markSold(cardId: number): void {
    const listings = this.listings.value;
    if (listings) {
      this.listings.next(listings.map((card) => (card.cardId === cardId ? { ...card, sold: true } : card)));
    }
  }

  markAvailable(cardId: number): void {
    const listings = this.listings.value;
    if (listings) {
      this.listings.next(listings.map((card) => (card.cardId === cardId ? { ...card, sold: false } : card)));
    }
  }

  private load(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.http.get<CardListing[]>(LISTINGS_URL).subscribe({
      next: (listings) => {
        this.loading = false;
        this.listings.next(listings);
      },
      error: () => {
        this.loading = false;
        this.listings.next(this.listings.value ?? []);
      },
    });
  }
}
