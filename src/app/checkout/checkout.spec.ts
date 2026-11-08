import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Order } from '../orders/order';
import { throwError } from 'rxjs';
import { CardService } from '../cards/card.service';
import { OrderService } from '../orders/order.service';
import { Checkout } from './checkout';
import { signIn } from '../testing/session';
import { provideSampleCards } from '../testing/sample-cards';
import { SampleOrderService } from '../testing/sample-orders';

describe('Checkout', () => {
  let harness: RouterTestingHarness;

  const element = () => harness.routeNativeElement!;
  const alert = () => element().querySelector('[role=alert]')?.textContent;

  async function open(cardId: number) {
    harness = await RouterTestingHarness.create(`/checkout/${cardId}`);
  }

  async function attach(type = 'image/png') {
    const input = element().querySelector<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'slip', { type })], configurable: true });
    input.dispatchEvent(new Event('change'));
    await harness.fixture.whenStable();
  }

  async function confirm() {
    element().querySelector<HTMLButtonElement>('.confirm')!.click();
    await harness.fixture.whenStable();
  }

  function placedOrders() {
    let orders: Order[] = [];
    TestBed.inject(SampleOrderService)
      .getOrders()
      .subscribe((value) => (orders = value));
    return orders;
  }

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:slip');
    URL.revokeObjectURL = vi.fn();
    TestBed.configureTestingModule({
      providers: [...provideSampleCards(), provideRouter([{ path: 'checkout/:cardId', component: Checkout }])],
    });
    signIn();
  });

  it('shows the card, seller and total', async () => {
    await open(2);

    const text = element().textContent;
    expect(text).toContain('Confirm your order');
    expect(text).toContain('Sample Card 02');
    expect(text).toContain('seller2');
    expect(text).toContain('2,800');
  });

  it("shows the seller's contact details and a link to their reviews", async () => {
    await open(2);

    const contact = element().querySelector('.contact')!;
    expect(contact.textContent).toContain('Sample Seller 2 (@seller2)');
    const links = Array.from(contact.querySelectorAll('.contact-link')).map((link) => link.getAttribute('href'));
    expect(links).toEqual(['mailto:seller2@test.local', 'tel:000-000-0002', '/sellers/seller2']);
    expect(contact.textContent).toContain('does not hold your money');
  });

  it('says when the seller has no phone number', async () => {
    await open(4);

    expect(element().querySelector('.contact')?.textContent).toContain('Not provided');
  });

  it('requires a payment slip', async () => {
    await open(2);
    const before = placedOrders().length;
    await confirm();

    expect(alert()).toContain('attach your payment slip');
    expect(placedOrders().length).toBe(before);
  });

  it('rejects a slip that is not a picture', async () => {
    await open(2);
    await attach('application/pdf');

    expect(alert()).toContain('JPG, PNG or WebP');
    expect(element().querySelector('.preview')).toBeNull();
  });

  it('places a pending order with the slip and shows the result', async () => {
    await open(2);
    await attach();

    expect(element().querySelector<HTMLImageElement>('.preview')?.getAttribute('src')).toBe('blob:slip');

    await confirm();

    expect(placedOrders().at(-1)).toEqual({
      orderId: 7,
      cardId: 2,
      buyerName: 'seller1',
      orderStatus: 'pending',
      orderPrice: 2800,
      paymentSlip: 'uploaded:slip',
    });
    expect(element().textContent).toContain('Order placed');
    expect(element().textContent).toContain('Waiting for payment check');
    expect(element().querySelector('.confirm')).toBeNull();
  });

  it('does not let users buy their own listing', async () => {
    await open(1);

    expect(element().textContent).toContain('your own listing');
    expect(element().querySelector('input[type=file]')).toBeNull();
    expect(element().querySelector('.confirm')).toBeNull();
  });

  it('does not sell a card someone has already bought', async () => {
    TestBed.inject(CardService).markSold(2);
    await open(2);

    expect(element().textContent).toContain('Card not available');
    expect(element().querySelector('.confirm')).toBeNull();
  });

  it("shows the API's message when the order fails", async () => {
    vi.spyOn(TestBed.inject(OrderService), 'placeOrder').mockReturnValue(
      throwError(() => new Error('Sorry, someone has already bought this card'))
    );
    await open(2);
    await attach();
    await confirm();

    expect(alert()).toContain('someone has already bought this card');
    expect(element().querySelector<HTMLButtonElement>('.confirm')!.disabled).toBe(false);
  });

  it('explains when the card does not exist', async () => {
    await open(999);

    expect(element().textContent).toContain('Card not available');
  });
});
