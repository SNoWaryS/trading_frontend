import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardListing } from '../cards/card-listing';
import { Order } from '../orders/order';
import { Review } from '../reviews/review';
import { ReviewService } from '../reviews/review.service';
import { ReviewForm } from './review-form';

const card: CardListing = {
  cardId: 7,
  cardName: 'Sample Card 07',
  sellerName: 'seller7',
  cardType: 'Pokémon',
  rarity: 'UR',
  referencePrice: null,
  cardPrice: 12500,
  cardStage: null,
  cardElement: null,
  cardPicture: null,
  cardDescription: null,
};

const receivedOrder: Order = {
  orderId: 1,
  cardId: 7,
  buyerName: 'seller1',
  orderStatus: 'received',
  orderPrice: 12500,
  paymentSlip: null,
};

describe('ReviewForm', () => {
  let fixture: ComponentFixture<ReviewForm>;
  let closed: ReturnType<typeof vi.fn<() => void>>;

  const element = () => fixture.nativeElement as HTMLElement;
  const alert = () => element().querySelector('[role=alert]')?.textContent;

  async function render(order: Order) {
    await TestBed.configureTestingModule({ imports: [ReviewForm] }).compileComponents();
    fixture = TestBed.createComponent(ReviewForm);
    fixture.componentRef.setInput('order', order);
    fixture.componentRef.setInput('card', card);
    closed = vi.fn<() => void>();
    fixture.componentInstance.closed.subscribe(closed);
    await fixture.whenStable();
  }

  async function write(text: string) {
    const field = element().querySelector<HTMLTextAreaElement>('textarea')!;
    field.value = text;
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit() {
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function savedReviews() {
    let reviews: Review[] = [];
    TestBed.inject(ReviewService)
      .getReviews()
      .subscribe((value) => (reviews = value));
    return reviews;
  }

  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  it('shows which order and card is being reviewed', async () => {
    await render(receivedOrder);

    const text = element().textContent;
    expect(text).toContain('Order #1');
    expect(text).toContain('Sample Card 07');
    expect(text).toContain('seller7');
  });

  it('saves the review with the status reviewed, then closes', async () => {
    await render(receivedOrder);

    await write('  Fast delivery, card as described.  ');
    await submit();

    expect(savedReviews()).toEqual([
      { reviewId: 1, orderId: 1, buyerName: 'seller1', reviewStatus: 'reviewed', comment: 'Fast delivery, card as described.' },
    ]);
    expect(closed).toHaveBeenCalled();
  });

  it('requires some text, and clears the warning once the user types', async () => {
    await render(receivedOrder);

    await write('   ');
    await submit();

    expect(alert()).toContain('write your review');
    expect(savedReviews()).toEqual([]);
    expect(closed).not.toHaveBeenCalled();

    await write('Good');
    expect(alert()).toBeUndefined();
  });

  it('refuses to review an order that has not been received', async () => {
    await render({ ...receivedOrder, orderStatus: 'shipped' });

    await write('Too early');
    await submit();

    expect(alert()).toContain('Confirm receipt');
    expect(savedReviews()).toEqual([]);
  });

  it('refuses a second review once the order is reviewed', async () => {
    await render(receivedOrder);
    TestBed.inject(ReviewService).addReview(receivedOrder, 'First review').subscribe();

    await write('Second review');
    await submit();

    expect(alert()).toContain('already been reviewed');
    expect(savedReviews()).toEqual([expect.objectContaining({ reviewStatus: 'reviewed', comment: 'First review' })]);
  });

  it('saves nothing on cancel', async () => {
    await render(receivedOrder);

    await write('Not sent');
    element().querySelector<HTMLButtonElement>('.secondary')!.click();
    await fixture.whenStable();

    expect(savedReviews()).toEqual([]);
    expect(closed).toHaveBeenCalled();
  });
});
