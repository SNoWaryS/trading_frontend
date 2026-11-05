import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
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

  describe('buttons', () => {
    beforeEach(() => {
      HTMLDialogElement.prototype.showModal = vi.fn();
      HTMLDialogElement.prototype.close = vi.fn();
    });

    const button = (text: string, root: ParentNode = element()) =>
      Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((item) => item.textContent?.trim() === text)!;

    async function fill(values: Record<string, string>) {
      for (const [id, text] of Object.entries(values)) {
        const field = element().querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
        field.value = text;
        field.dispatchEvent(new Event('input'));
      }
      await fixture.whenStable();
    }

    async function save() {
      element().querySelector('app-edit-profile form')!.dispatchEvent(new Event('submit'));
      await fixture.whenStable();
    }

    it('edits the profile, starting from the current details', async () => {
      await render();
      button('Edit profile').click();
      await fixture.whenStable();

      expect(element().querySelector<HTMLInputElement>('#profile-name')!.value).toBe('Sample');
      expect(element().querySelector<HTMLTextAreaElement>('#profile-address')!.value).toBe('123 Sample Road, Bangkok 10100');

      await fill({ 'profile-name': ' มานี ', 'profile-phone': '0812345678', 'profile-address': '' });
      await save();

      expect(element().querySelector('app-edit-profile')).toBeNull();
      expect(element().querySelector('h1')?.textContent).toContain('มานี Collector');
      expect(value('Phone number')).toBe('0812345678');
      expect(value('Address')).toBe('Not provided');
      expect(value('Username')).toBe('seller1');
    });

    it.each([
      [{ 'profile-surname': '  ' }, 'name, surname and email'],
      [{ 'profile-email': 'not-an-email' }, 'valid email'],
    ])('rejects %j and keeps the old details', async (values, message) => {
      await render();
      button('Edit profile').click();
      await fixture.whenStable();

      await fill(values);
      await save();

      expect(element().querySelector('app-edit-profile [role=alert]')?.textContent).toContain(message);
      expect(element().querySelector('h1')?.textContent).toContain('Sample Collector');
      expect(value('Email')).toBe('seller1@test.local');
    });

    it('logs out to the login page', async () => {
      await render();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      button('Log out').click();

      expect(navigate).toHaveBeenCalledWith(['/login']);
    });

    it('asks before deleting the account', async () => {
      await render();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      button('Delete account').click();
      await fixture.whenStable();

      const dialog = element().querySelector('app-delete-account')!;
      expect(dialog.textContent).toContain('30 days');
      expect(navigate).not.toHaveBeenCalled();

      button('Delete account', dialog).click();
      await fixture.whenStable();

      expect(navigate).toHaveBeenCalledWith(['/login'], { state: { accountDeleted: true } });
    });

    it('keeps the account when the user changes their mind', async () => {
      await render();
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

      button('Delete account').click();
      await fixture.whenStable();
      button('Keep my account', element().querySelector('app-delete-account')!).click();
      await fixture.whenStable();

      expect(element().querySelector('app-delete-account')).toBeNull();
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('reviews from buyers', () => {
    const reviews = () =>
      Array.from(element().querySelectorAll('.review')).map(
        (item) => `${item.querySelector('.review-meta')?.textContent} | ${item.querySelector('.review-text')?.textContent}`
      );

    it('shows what other buyers wrote about the user’s cards, newest first', async () => {
      await render();

      expect(element().querySelector('.reviews-subtitle')?.textContent).toContain('2 reviews');
      expect(reviews()).toEqual([
        'buyer3 bought Sample Card 06 | Fast reply and quick delivery. Would buy again.',
        'buyer2 bought Sample Card 03 | Card arrived well packed and exactly as described. Thank you!',
      ]);
    });

    it('leaves out reviews the user wrote as a buyer', async () => {
      await render();

      TestBed.inject(OrderService)
        .getMyOrders()
        .subscribe((orders) => {
          const received = orders.find((order) => order.orderStatus === 'received')!;
          TestBed.inject(ReviewService).addReview(received, 'Written by me').subscribe();
        })
        .unsubscribe();
      await fixture.whenStable();

      expect(reviews().length).toBe(2);
      expect(element().querySelector('.reviews')?.textContent).not.toContain('Written by me');
    });

    it('says so when nobody has reviewed the user yet', async () => {
      await render([
        { provide: ReviewService, useValue: { getReviews: () => of([]), getReviewsForSeller: () => of([]) } },
      ]);

      expect(reviews()).toEqual([]);
      expect(element().querySelector('.reviews .empty')?.textContent).toContain('No reviews from buyers yet');
    });
  });
});
