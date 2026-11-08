import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api';
import { CardListing } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { ReviewService } from '../reviews/review.service';
import { signIn } from '../testing/session';
import { Order, Sale } from './order';
import { OrderService } from './order.service';

const ORDERS = `${API_URL}/api/orders`;

const card: CardListing = {
  cardId: 8,
  catalogId: 100,
  cardName: 'สตรินเดอร์',
  sellerName: 'seller2',
  cardType: 'โปเกมอน',
  rarity: 'AR',
  referencePrice: 45,
  cardPrice: 45,
  cardStage: 'ร่าง 1',
  cardElement: 'สายฟ้า',
  cardPicture: null,
  cardDescription: null,
  sold: false,
};

function order(orderId: number, orderStatus: Order['orderStatus'] = 'pending'): Order {
  return { orderId, cardId: 8, buyerName: 'seller1', orderStatus, orderPrice: 45, paymentSlip: `${ORDERS}/${orderId}/slip` };
}

describe('OrderService', () => {
  let http: HttpTestingController;
  let service: OrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(OrderService);
    signIn();
  });

  afterEach(() => http.verify());

  it("loads the user's orders and sales", async () => {
    const mine = firstValueFrom(service.getMyOrders());
    http.expectOne(`${ORDERS}/mine`).flush([order(2), order(1)]);
    expect((await mine).map((item) => item.orderId)).toEqual([2, 1]);

    const sale: Sale = {
      ...order(3),
      buyer: { name: 'Test', surname: 'User', email: 'testuser@test.local', phoneNumber: null, address: 'Bangkok' },
    };
    const sales = firstValueFrom(service.getSales());
    http.expectOne(`${ORDERS}/sales`).flush([sale]);
    expect((await sales)[0].buyer.address).toBe('Bangkok');
  });

  it('places an order with the slip as a form and marks the card sold', async () => {
    let listings: CardListing[] = [];
    TestBed.inject(CardService).getListings().subscribe((value) => (listings = value));
    http.expectOne(`${API_URL}/api/listings`).flush([card]);

    const slip = new File(['x'], 'slip.png', { type: 'image/png' });
    const placed = firstValueFrom(service.placeOrder(card, slip));
    const request = http.expectOne(ORDERS);
    expect(request.request.method).toBe('POST');
    const form = request.request.body as FormData;
    expect(form.get('cardId')).toBe('8');
    expect(form.get('slip')).toBe(slip);
    request.flush(order(9));

    expect((await placed).orderId).toBe(9);
    expect(listings[0].sold).toBe(true);
  });

  it('passes on the message when someone bought the card first', async () => {
    const placed = firstValueFrom(service.placeOrder(card, new File(['x'], 'slip.png')));
    http.expectOne(ORDERS).flush({ message: 'Sorry, someone has already bought this card' }, { status: 409, statusText: 'Conflict' });

    await expect(placed).rejects.toThrow('someone has already bought this card');
  });

  it('ships a sale and confirms receipt of an order', async () => {
    const shipped = firstValueFrom(service.shipOrder(3));
    const ship = http.expectOne(`${ORDERS}/3/ship`);
    expect(ship.request.method).toBe('POST');
    ship.flush(order(3, 'shipped'));
    expect((await shipped).orderStatus).toBe('shipped');

    const received = firstValueFrom(service.confirmReceipt(2));
    http.expectOne(`${ORDERS}/2/receive`).flush(order(2, 'received'));
    expect((await received).orderStatus).toBe('received');
  });

  it('cancels an order and puts its card back on sale', async () => {
    let listings: CardListing[] = [];
    TestBed.inject(CardService).getListings().subscribe((value) => (listings = value));
    http.expectOne(`${API_URL}/api/listings`).flush([{ ...card, sold: true }]);

    const cancelled = firstValueFrom(service.cancelOrder(4));
    const request = http.expectOne(`${ORDERS}/4/cancel`);
    expect(request.request.method).toBe('POST');
    request.flush(order(4, 'cancelled'));

    expect((await cancelled).orderStatus).toBe('cancelled');
    expect(listings[0].sold).toBe(false);
  });

  it("passes on the API's message when the order cannot be cancelled", async () => {
    const cancelled = firstValueFrom(service.cancelOrder(4));
    http
      .expectOne(`${ORDERS}/4/cancel`)
      .flush({ message: 'Only an order that has not been shipped yet can be cancelled' }, { status: 409, statusText: 'Conflict' });

    await expect(cancelled).rejects.toThrow('not been shipped yet');
  });
});

describe('ReviewService', () => {
  let http: HttpTestingController;
  let service: ReviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ReviewService);
  });

  afterEach(() => http.verify());

  it("loads a seller's reviews", async () => {
    const reviews = firstValueFrom(service.getReviewsForSeller('seller1'));
    const request = http.expectOne((r) => r.url === `${API_URL}/api/reviews`);
    expect(request.request.params.get('seller')).toBe('seller1');
    request.flush([{ review: { reviewId: 1, orderId: 4, buyerName: 'buyer2', reviewStatus: 'reviewed', comment: 'ดี' }, card }]);

    expect((await reviews)[0].card.cardName).toBe('สตรินเดอร์');
  });

  it('posts a review for an order and adds it to my reviews', async () => {
    let mine: unknown[] = [];
    service.getReviews().subscribe((value) => (mine = value));
    http.expectOne(`${API_URL}/api/reviews/mine`).flush([]);

    const added = firstValueFrom(service.addReview(order(2, 'received'), 'ส่งไวมาก'));
    const request = http.expectOne(`${ORDERS}/2/review`);
    expect(request.request.body).toEqual({ comment: 'ส่งไวมาก' });
    request.flush({ reviewId: 5, orderId: 2, buyerName: 'seller1', reviewStatus: 'reviewed', comment: 'ส่งไวมาก' });

    expect((await added).reviewId).toBe(5);
    expect(mine.length).toBe(1);
  });

  it("passes on the API's message", async () => {
    const added = firstValueFrom(service.addReview(order(2, 'received'), 'again'));
    http.expectOne(`${ORDERS}/2/review`).flush({ message: 'This order has already been reviewed' }, { status: 409, statusText: 'Conflict' });

    await expect(added).rejects.toThrow('already been reviewed');
  });
});
