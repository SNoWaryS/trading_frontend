import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SellerProfile } from './seller-profile';

describe('SellerProfile', () => {
  let harness: RouterTestingHarness;

  const element = () => harness.routeNativeElement!;
  const names = () => Array.from(element().querySelectorAll('.name')).map((name) => name.textContent);
  const stat = (label: string) =>
    Array.from(element().querySelectorAll('.stats div'))
      .find((item) => item.querySelector('dt')?.textContent === label)
      ?.querySelector('dd')?.textContent;

  async function open(username: string) {
    harness = await RouterTestingHarness.create(`/sellers/${username}`);
  }

  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'sellers/:username', component: SellerProfile }])],
    });
  });

  it('shows the seller and only their cards', async () => {
    await open('seller2');

    expect(element().querySelector('h1')?.textContent).toContain('Sample Seller 2');
    expect(element().querySelector('.subtitle')?.textContent).toContain('@seller2');
    expect(names()).toEqual(['Sample Card 02']);
    expect(stat('Cards for sale')).toBe('1');
  });

  it('shows reviews from buyers of the seller’s cards', async () => {
    await open('seller2');

    const reviews = element().querySelectorAll('.review');
    expect(stat('Reviews')).toBe('1');
    expect(reviews.length).toBe(1);
    expect(reviews[0].textContent).toContain('buyer3');
    expect(reviews[0].textContent).toContain('Honest seller');
  });

  it('shows the seller’s email and phone number as contact links', async () => {
    await open('seller2');

    const links = Array.from(element().querySelectorAll<HTMLAnchorElement>('.contact-link'));
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['seller2@test.local', 'mailto:seller2@test.local'],
      ['000-000-0002', 'tel:000-000-0002'],
    ]);
  });

  it('says when the seller has no phone number, and never shows their address', async () => {
    await open('seller1');

    const contact = element().querySelector('.contact')!;
    expect(contact.textContent).toContain('seller1@test.local');
    expect(contact.textContent).toContain('Not provided');
    expect(contact.querySelector('a[href^="tel:"]')).toBeNull();
    expect(element().textContent).not.toContain('Sample Road');
  });

  it('opens the card details without a link back to the same seller, and can buy from there', async () => {
    await open('seller2');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    element().querySelector<HTMLElement>('.listing')!.click();
    await harness.fixture.whenStable();

    const dialog = element().querySelector('dialog')!;
    expect(dialog.textContent).toContain('Sample Card 02');
    expect(dialog.querySelector('.seller-link')).toBeNull();

    dialog.querySelector<HTMLButtonElement>('.buy')!.click();
    expect(navigate).toHaveBeenCalledWith(['/checkout', 2]);
  });

  it('shows empty states for a seller with no cards or reviews', async () => {
    await open('seller8');

    expect(names()).toEqual(['Sample Card 08']);
    expect(element().querySelector('.section:last-of-type .empty')?.textContent).toContain('No reviews from buyers yet');
  });

  it('explains when the seller does not exist', async () => {
    await open('nobody');

    expect(element().querySelector('h1')?.textContent).toContain('Seller not found');
    expect(element().querySelector('.listing')).toBeNull();
  });
});
