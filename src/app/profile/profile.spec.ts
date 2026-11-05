import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ReviewService } from '../reviews/review.service';
import { OrderService } from '../orders/order.service';
import { UserService } from '../users/user.service';
import { Profile } from './profile';

describe('Profile', () => {
  let fixture: ComponentFixture<Profile>;

  const element = () => fixture.nativeElement as HTMLElement;
  const value = (label: string) =>
    Array.from(element().querySelectorAll('.info div'))
      .find((row) => row.querySelector('dt')?.textContent === label)
      ?.querySelector('dd')?.textContent;
  const stat = (label: string) =>
    Array.from(element().querySelectorAll('.stat'))
      .find((item) => item.textContent?.includes(label))
      ?.querySelector('.stat-value')?.textContent;

  async function render(providers: object[] = []) {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [provideRouter([]), ...providers],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    await fixture.whenStable();
  }

  it('shows the user’s details without the password', async () => {
    await render();

    expect(element().querySelector('h1')?.textContent).toContain('Sample Collector');
    expect(element().querySelector('.avatar')?.textContent).toBe('SC');
    expect(value('Username')).toBe('seller1');
    expect(value('Email')).toBe('seller1@test.local');
    expect(value('Address')).toBe('123 Sample Road, Bangkok 10100');
    expect(element().textContent?.toLowerCase()).not.toContain('password');
  });

  it('marks details the user has not provided', async () => {
    await render();

    expect(value('Phone number')).toBe('Not provided');
  });

  it('counts the user’s cards, orders and reviews', async () => {
    await render();

    expect(stat('Cards for sale')).toBe('3');
    expect(stat('Orders')).toBe('3');
    expect(stat('Reviews written')).toBe('0');
  });

  it('counts a review once the user writes one', async () => {
    await render();

    TestBed.inject(OrderService)
      .getMyOrders()
      .subscribe((orders) => {
        const received = orders.find((order) => order.orderStatus === 'received')!;
        TestBed.inject(ReviewService).addReview(received, 'Great').subscribe();
      })
      .unsubscribe();
    await fixture.whenStable();

    expect(stat('Reviews written')).toBe('1');
  });

  it('links the activity to the sell and orders pages', async () => {
    await render();

    const links = Array.from(element().querySelectorAll('.stat')).map((link) => link.getAttribute('href'));
    expect(links).toEqual(['/sell', '/orders', '/orders']);
  });

  it('shows the details it is given for another user', async () => {
    await render([
      {
        provide: UserService,
        useValue: {
          getCurrentUser: () =>
            of({ userId: 2, name: 'มานี', surname: 'ใจดี', username: 'manee', email: 'manee@test.local', phoneNumber: '0812345678', address: null }),
        },
      },
    ]);

    expect(element().querySelector('h1')?.textContent).toContain('มานี ใจดี');
    expect(value('Phone number')).toBe('0812345678');
    expect(value('Address')).toBe('Not provided');
  });
});
