import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { OrderService } from '../orders/order.service';
import { provideSampleCards } from '../testing/sample-cards';
import { SampleOrderService } from '../testing/sample-orders';
import { signIn } from '../testing/session';
import { Sales } from './sales';

describe('Sales', () => {
  let element: HTMLElement;
  const rows = () => Array.from(element.querySelectorAll('.row'));
  const stable = () => TestBed.inject(ApplicationRef).whenStable();

  async function render(providers: object[] = []) {
    await TestBed.configureTestingModule({
      imports: [Sales],
      providers: [...provideSampleCards(), provideRouter([]), ...providers],
    }).compileComponents();
    signIn(); // seller1, whose cards 3 and 6 were bought by buyer2 and buyer3

    const fixture = TestBed.createComponent(Sales);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  it("lists the orders for the user's cards with where to send them", async () => {
    await render();

    expect(rows().map((row) => row.querySelector('.name')?.textContent)).toEqual(['Sample Card 03', 'Sample Card 06']);
    expect(rows()[0].textContent).toContain('Bought by buyer2');
    expect(rows()[0].querySelector('.address')?.textContent).toContain('Chiang Mai');
    expect(rows()[0].querySelector('.status')?.textContent).toContain('Received');
  });

  it('marks a pending order as shipped after the seller confirms', async () => {
    await render();
    // Put buyer2's order back to pending, as if they had just paid.
    TestBed.inject(SampleOrderService).setStatus(4, 'pending');
    await stable();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    rows()[0].querySelector<HTMLButtonElement>('.ship')!.click();
    await stable();

    expect(window.confirm).toHaveBeenCalledWith('Have you checked the payment and sent Sample Card 03 to buyer2?');
    expect(rows()[0].querySelector('.status')?.textContent).toContain('Shipped');
    expect(rows()[0].querySelector('.ship')).toBeNull();
  });

  it('says when nobody has ordered the cards yet', async () => {
    await render([{ provide: OrderService, useValue: { getSales: () => of([]) } }]);

    expect(rows()).toEqual([]);
    expect(element.querySelector('.empty')?.textContent).toContain('Nobody has ordered your cards yet');
  });
});
