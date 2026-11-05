import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, throwError } from 'rxjs';
import { CardListing } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { Order } from '../orders/order';
import { OrderService } from '../orders/order.service';
import { isReviewed, Review } from './review';

export interface SellerReview {
  review: Review;
  card: CardListing;
}

// Reviews that buyers wrote for sample sellers: orders 4 and 5 for seller1, order 6 for seller2.
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
  {
    reviewId: 3,
    orderId: 6,
    buyerName: 'buyer3',
    reviewStatus: 'reviewed',
    comment: 'Honest seller, the card looked even better in person.',
  },
];

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly orders = inject(OrderService);
  private readonly cards = inject(CardService);

  // Reviews held in memory for now. Replace these methods with HttpClient calls once the API exists.
  private readonly reviews = new BehaviorSubject<Review[]>(SAMPLE_REVIEWS);

  getReviews(): Observable<Review[]> {
    return this.reviews.asObservable();
  }

  // Reviews buyers wrote on orders for this seller's cards, newest first.
  getReviewsForSeller(sellerName: string): Observable<SellerReview[]> {
    return combineLatest([this.reviews, this.orders.getOrders(), this.cards.getListings()]).pipe(
      map(([reviews, orders, listings]) =>
        reviews
          .filter(isReviewed)
          .flatMap((review) => {
            const order = orders.find((item) => item.orderId === review.orderId);
            const card = order && listings.find((listing) => listing.cardId === order.cardId);
            return card && card.sellerName === sellerName ? [{ review, card }] : [];
          })
          .reverse()
      )
    );
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
