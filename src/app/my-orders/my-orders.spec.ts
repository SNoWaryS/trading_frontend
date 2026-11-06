import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OrderService } from '../orders/order.service';
import { MyOrders } from './my-orders';
import { signIn } from '../testing/session';

describe('MyOrders', () => {
  let fixture: ComponentFixture<MyOrders>;

  const element = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(element().querySelectorAll<HTMLElement>('.row'));
  const row = (orderId: number) => rows().find((item) => item.textContent?.includes(`Order #${orderId} `))!;
  const dialog = () => element().querySelector('dialog');

  async function render(providers: object[] = []) {
    await TestBed.configureTestingModule({
      imports: [MyOrders],
      providers: [provideRouter([]), ...providers],
    }).compileComponents();
    signIn();

    fixture = TestBed.createComponent(MyOrders);
    await fixture.whenStable();
  }

  async function openDetail(orderId: number) {
    row(orderId).click();
    await fixture.whenStable();
  }

  async function click(selector: string, text: string) {
    const button = Array.from(dialog()!.querySelectorAll<HTMLButtonElement>(selector)).find((item) =>
      item.textContent?.includes(text)
    )!;
    button.click();
    await fixture.whenStable();
  }

  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  });

  it('lists the user’s orders, newest first, with card, seller, price and status', async () => {
    await render();

    expect(rows().map((item) => item.querySelector('.name')?.textContent)).toEqual([
      'Sample Card 05',
      'Sample Card 04',
      'Sample Card 07',
    ]);
    expect(row(2).textContent).toContain('seller4');
    expect(row(2).textContent).toContain('8,900');
    expect(row(2).querySelector('.status')?.textContent).toContain('Shipped');
  });

  it('only enables Review after the card has been received', async () => {
    await render();

    const review = (orderId: number) => row(orderId).querySelector<HTMLButtonElement>('.review')!;
    expect(review(1).disabled).toBe(false);
    expect(review(2).disabled).toBe(true);
    expect(review(3).disabled).toBe(true);
  });

  it('opens the review form, not the details, when Review is clicked', async () => {
    await render();

    row(1).querySelector<HTMLButtonElement>('.review')!.click();
    await fixture.whenStable();

    expect(element().querySelector('app-review-form')).not.toBeNull();
    expect(element().querySelector('app-order-detail')).toBeNull();
  });

  it('marks the order as reviewed and shows the review in the details', async () => {
    await render();

    row(1).querySelector<HTMLButtonElement>('.review')!.click();
    await fixture.whenStable();
    const comment = element().querySelector<HTMLTextAreaElement>('app-review-form textarea')!;
    comment.value = 'Great seller';
    comment.dispatchEvent(new Event('input'));
    element().querySelector('app-review-form form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const review = row(1).querySelector<HTMLButtonElement>('.review')!;
    expect(element().querySelector('app-review-form')).toBeNull();
    expect(review.textContent).toContain('Reviewed');
    expect(review.disabled).toBe(true);

    await openDetail(1);
    expect(dialog()?.textContent).toContain('Your review');
    expect(dialog()?.textContent).toContain('Great seller');
  });

  it('shows the purchased card in the details', async () => {
    await render();
    await openDetail(2);

    const text = dialog()?.textContent;
    expect(text).toContain('Order #2');
    expect(text).toContain('Sample Card 04');
    expect(text).toContain('seller4');
    expect(text).toContain('8,900');
    expect(text).toContain('Sample description');
  });

  it('confirms receipt after asking, which enables Review', async () => {
    await render();
    await openDetail(2);

    await click('.primary', 'Confirm receipt');
    expect(dialog()?.textContent).toContain('Did you receive this card');
    expect(row(2).querySelector<HTMLButtonElement>('.review')!.disabled).toBe(true);

    await click('.primary', 'Yes, I received it');

    expect(dialog()?.textContent).toContain('You confirmed that you received this card');
    expect(row(2).querySelector('.status')?.textContent).toContain('Received');
    expect(row(2).querySelector<HTMLButtonElement>('.review')!.disabled).toBe(false);
  });

  it('keeps the order as it was when the user answers Not yet', async () => {
    await render();
    await openDetail(2);

    await click('.primary', 'Confirm receipt');
    await click('.secondary', 'Not yet');

    expect(dialog()?.textContent).toContain('Confirm receipt');
    expect(row(2).querySelector('.status')?.textContent).toContain('Shipped');
  });

  it('does not allow confirming receipt before the seller has sent the card', async () => {
    await render();
    await openDetail(3);

    const button = Array.from(dialog()!.querySelectorAll<HTMLButtonElement>('.primary')).find((item) =>
      item.textContent?.includes('Confirm receipt')
    )!;
    expect(button.disabled).toBe(true);
  });

  it('shows a message when there are no orders', async () => {
    await render([{ provide: OrderService, useValue: { getMyOrders: () => of([]) } }]);

    expect(rows()).toEqual([]);
    expect(element().querySelector('.empty')?.textContent).toContain('not ordered any cards');
  });
});
