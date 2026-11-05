import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Order } from '../orders/order';
import { isReviewed, Review } from './review';

// Reviews that other buyers wrote for the sample user's cards (orders 4 and 5).
const SAMPLE_REVIEWS: Review[] = [
  {
    reviewId: 1,
    orderId: 4,
    buyerName: 'buyer2',
    reviewStatus: 'reviewed',
    comment: 'Card arrived well packed and exactly as described. Thank you!',
  },
  {
    reviewId: 2,
    orderId: 5,
    buyerName: 'buyer3',
    reviewStatus: 'reviewed',
    comment: 'Fast reply and quick delivery. Would buy again.',
  },
];

@Injectable({ providedIn: 'root' })
export class ReviewService {
  // Reviews held in memory for now. Replace these methods with HttpClient calls once the API exists.
  private readonly reviews = new BehaviorSubject<Review[]>(SAMPLE_REVIEWS);

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
