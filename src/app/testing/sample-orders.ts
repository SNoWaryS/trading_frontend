import { inject, Injectable, Provider } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, of, tap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CardListing } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { BuyerContact, Order, OrderStatus, Sale } from '../orders/order';
import { OrderService } from '../orders/order.service';
import { isReviewed, Review } from '../reviews/review';
import { ReviewService, SellerReview } from '../reviews/review.service';

// For tests: orders and reviews held in memory instead of the orders and reviews API, with the same sample data the
// database seed (back/seed_sample_listings.sql) uses. Use with provideSampleCards() from ./sample-cards.

function sampleBuyer(username: string): BuyerContact {
  return { name: 'Sample', surname: username, email: `${username}@test.local`, phoneNumber: null, address: '12 Buyer Lane, Chiang Mai 50000' };
}

// Orders 1 to 3 belong to the sample buyer seller1. Log in as seller1 to see them as your own.
const SAMPLE_COLLECTOR = 'seller1';

const SAMPLE_ORDERS: Order[] = [
  { orderId: 1, cardId: 7, buyerName: SAMPLE_COLLECTOR, orderStatus: 'received', orderPrice: 12500, paymentSlip: null },
  { orderId: 2, cardId: 4, buyerName: SAMPLE_COLLECTOR, orderStatus: 'shipped', orderPrice: 8900, paymentSlip: null },
  { orderId: 3, cardId: 5, buyerName: SAMPLE_COLLECTOR, orderStatus: 'pending', orderPrice: 1590, paymentSlip: null },
  // Other buyers' orders for the sample user's cards, so the profile has reviews from buyers.
  // Note: these sample cards still show as for sale, because CARDS has no sold status yet.
  { orderId: 4, cardId: 3, buyerName: 'buyer2', orderStatus: 'received', orderPrice: 320, paymentSlip: null },
  { orderId: 5, cardId: 6, buyerName: 'buyer3', orderStatus: 'received', orderPrice: 680, paymentSlip: null },
  // Another buyer's order from seller2, so other sellers' profiles have a review too.
  { orderId: 6, cardId: 2, buyerName: 'buyer3', orderStatus: 'received', orderPrice: 2800, paymentSlip: null },
];

@Injectable()
export class SampleOrderService implements Pick<OrderService, keyof OrderService> {
  private readonly auth = inject(AuthService);
  private readonly cards = inject(CardService);

  private readonly orders = new BehaviorSubject<Order[]>(SAMPLE_ORDERS);

  getOrders(): Observable<Order[]> {
    return this.orders.asObservable();
  }

  // The logged-in user's orders.
  getMyOrders(): Observable<Order[]> {
    return combineLatest([this.orders, this.auth.user$]).pipe(
      // Newest first, like the API.
      map(([orders, user]) => orders.filter((order) => order.buyerName === user?.username).reverse())
    );
  }

  placeOrder(card: CardListing, slip: File): Observable<Order> {
    const buyerName = this.auth.username();
    if (!buyerName) {
      return throwError(() => new Error('Please log in to buy a card'));
    }

    const current = this.orders.value;
    const order: Order = {
      orderId: Math.max(0, ...current.map((existing) => existing.orderId)) + 1,
      cardId: card.cardId,
      buyerName,
      orderStatus: 'pending',
      orderPrice: card.cardPrice,
      paymentSlip: `uploaded:${slip.name}`,
    };
    this.orders.next([...current, order]);
    return of(order);
  }

  // Orders for the logged-in user's cards. Every sample buyer gets the same sample address.
  getSales(): Observable<Sale[]> {
    return combineLatest([this.orders, this.cards.getMyListings()]).pipe(
      map(([orders, mine]) =>
        orders
          .filter((order) => mine.some((card) => card.cardId === order.cardId))
          .map((order) => ({ ...order, buyer: sampleBuyer(order.buyerName) }))
      )
    );
  }

  shipOrder(orderId: number): Observable<Order> {
    return this.move(orderId, 'pending', 'shipped', 'This order has already been shipped');
  }

  // Only a shipped order can be marked as received.
  confirmReceipt(orderId: number): Observable<Order> {
    return this.move(orderId, 'shipped', 'received', 'This order cannot be marked as received');
  }

  cancelOrder(orderId: number): Observable<Order> {
    return this.move(orderId, 'pending', 'cancelled', 'Only an order that has not been shipped yet can be cancelled').pipe(
      tap((order) => this.cards.markAvailable(order.cardId))
    );
  }

  // For tests that need an order in a particular state.
  setStatus(orderId: number, orderStatus: OrderStatus): void {
    this.orders.next(this.orders.value.map((order) => (order.orderId === orderId ? { ...order, orderStatus } : order)));
  }

  private move(orderId: number, from: OrderStatus, to: OrderStatus, message: string): Observable<Order> {
    const order = this.orders.value.find((existing) => existing.orderId === orderId);
    if (!order || order.orderStatus !== from) {
      return throwError(() => new Error(message));
    }
    const moved: Order = { ...order, orderStatus: to };
    this.orders.next(this.orders.value.map((existing) => (existing.orderId === orderId ? moved : existing)));
    return of(moved);
  }
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

@Injectable()
export class SampleReviewService implements Pick<ReviewService, keyof ReviewService> {
  private readonly orders = inject(SampleOrderService);
  private readonly cards = inject(CardService);

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

export function provideSampleOrders(): Provider[] {
  return [
    SampleOrderService,
    { provide: OrderService, useExisting: SampleOrderService },
    { provide: ReviewService, useClass: SampleReviewService },
  ];
}
