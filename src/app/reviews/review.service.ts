import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, filter, Observable, of, tap, throwError } from 'rxjs';
import { API_URL } from '../api';
import { CardListing } from '../cards/card-listing';
import { Order } from '../orders/order';
import { Review } from './review';

export interface SellerReview {
  review: Review;
  card: CardListing;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly mine = new BehaviorSubject<Review[] | null>(null);

  getReviews(): Observable<Review[]> {
    this.http.get<Review[]>(`${API_URL}/api/reviews/mine`).subscribe({
      next: (reviews) => this.mine.next(reviews),
      error: () => this.mine.next(this.mine.value ?? []),
    });
    return this.mine.pipe(filter((reviews): reviews is Review[] => reviews !== null));
  }

  getReviewsForSeller(sellerName: string): Observable<SellerReview[]> {
    const params = new HttpParams().set('seller', sellerName);
    return this.http
      .get<SellerReview[]>(`${API_URL}/api/reviews`, { params })
      .pipe(catchError(() => of<SellerReview[]>([])));
  }

  addReview(order: Order, comment: string): Observable<Review> {
    return this.http.post<Review>(`${API_URL}/api/orders/${order.orderId}/review`, { comment }).pipe(
      tap((review) => this.mine.next([review, ...(this.mine.value ?? []).filter((item) => item.orderId !== order.orderId)])),
      catchError((error: HttpErrorResponse) =>
        throwError(
          () => new Error(typeof error.error?.message === 'string' ? error.error.message : 'Cannot save your review right now. Please try again.')
        )
      )
    );
  }
}
