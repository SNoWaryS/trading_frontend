import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Order } from '../orders/order';
import { OrderService } from '../orders/order.service';
import { Checkout } from './checkout';

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
    TestBed.inject(OrderService)
      .getOrders()
      .subscribe((value) => (orders = value));
    return orders;
  }

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:slip');
    URL.revokeObjectURL = vi.fn();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'checkout/:cardId', component: Checkout }])],
    });
  });

  it('shows the card, seller and total', async () => {
    await open(2);

    const text = element().textContent;
    expect(text).toContain('Confirm your order');
    expect(text).toContain('Sample Card 02');
    expect(text).toContain('seller2');
    expect(text).toContain('2,800');
  });

  it('requires a payment slip', async () => {
    await open(2);
    await confirm();

    expect(alert()).toContain('attach your payment slip');
    expect(placedOrders().some((order) => order.cardId === 2)).toBe(false);
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
      orderId: 4,
      cardId: 2,
      buyerName: 'seller1',
      orderStatus: 'pending',
      orderPrice: 2800,
      paymentSlip: 'blob:slip',
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

  it('explains when the card does not exist', async () => {
    await open(999);

    expect(element().textContent).toContain('Card not available');
  });
});
