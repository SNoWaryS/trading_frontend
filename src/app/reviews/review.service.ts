import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Order } from '../orders/order';
import { isReviewed, Review } from './review';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  // Reviews held in memory for now. Replace these methods with HttpClient calls once the API exists.
  private readonly reviews = new BehaviorSubject<Review[]>([]);

  getReviews(): Observable<Review[]> {
    return this.reviews.asObservable();
  }

  // Only a received order can be reviewed, and only while its review status is not 'reviewed'.
  addReview(order: Order, comment: string): Observable<Review> {
    const current = this.reviews.value;
    const existing = current.find((review) => review.orderId === order.orderId);

    if (order.orderStatus !== 'received') {
      return throwError(() => new Error('Confirm receipt before reviewing this order'));
    }
    if (isReviewed(existing)) {
      return throwError(() => new Error('This order has already been reviewed'));
    }

    const review: Review = {
      reviewId: existing?.reviewId ?? Math.max(0, ...current.map((item) => item.reviewId)) + 1,
      orderId: order.orderId,
      buyerName: order.buyerName,
      reviewStatus: 'reviewed',
      comment,
    };
    this.reviews.next(existing ? current.map((item) => (item === existing ? review : item)) : [...current, review]);
    return of(review);
  }
}
