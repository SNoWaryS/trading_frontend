import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CardService } from '../cards/card.service';
import { of } from 'rxjs';
import { CardListing } from '../cards/card-listing';
import { SIMILAR_SEARCH_DELAY_MS } from '../similar-cards/similar-cards';
import { Home } from './home';
import { signIn } from '../testing/session';
import { provideSampleCards } from '../testing/sample-cards';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;

  const element = () => fixture.nativeElement as HTMLElement;
  const names = () => Array.from(element().querySelectorAll('.name')).map((name) => name.textContent);

  const dialog = () => element().querySelector('dialog');
  const nameButton = () => element().querySelector<HTMLButtonElement>('.name-button')!;

  beforeEach(async () => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [...provideSampleCards(), provideRouter([])],
    }).compileComponents();
    signIn();

    fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
  });

  it('lists the cards for sale with their prices', () => {
    expect(names().length).toBe(8);
    expect(element().querySelector('.price')?.textContent).toContain('1,250');
  });

  it('leaves out cards someone has already bought', async () => {
    TestBed.inject(CardService).markSold(1);
    await fixture.whenStable();

    expect(names().length).toBe(7);
    expect(names()).not.toContain('Sample Card 01');
  });

  it('links to the sell page', () => {
    const links = Array.from(element().querySelectorAll('a')).map((link) => link.getAttribute('href'));
    expect(links).toContain('/sell');
  });

  it('filters by element', async () => {
    const chip = Array.from(element().querySelectorAll<HTMLButtonElement>('.chip')).find(
      (button) => button.textContent === 'Lightning'
    )!;
    chip.click();
    await fixture.whenStable();

    expect(names()).toEqual(['Sample Card 04']);
  });

  it('shows a message when the search matches nothing', async () => {
    const search = element().querySelector<HTMLInputElement>('.search')!;
    search.value = 'no such card';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(names()).toEqual([]);
    expect(element().querySelector('.empty')?.textContent).toContain('No cards match');
  });

  it('shows the card details and seller when a card is clicked', async () => {
    element().querySelector<HTMLElement>('.listing')!.click();
    await fixture.whenStable();

    const text = dialog()?.textContent;
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(text).toContain('Sample Card 01');
    expect(text).toContain('seller1');
    expect(text).toContain('1,250');
    expect(text).toContain('1,400');
    expect(text).toContain('AR');
    expect(text).toContain('Water');
    expect(text).toContain('Basic');
    expect(text).toContain('Sample description');
  });

  it('opens the details from the card name button', async () => {
    nameButton().click();
    await fixture.whenStable();

    expect(dialog()).not.toBeNull();
  });

  it('closes the details from the close button', async () => {
    nameButton().click();
    await fixture.whenStable();

    dialog()!.querySelector<HTMLButtonElement>('.close')!.click();
    await fixture.whenStable();

    expect(dialog()).toBeNull();
  });

  it('goes to the order page when Buy is clicked, without opening the details', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    element().querySelector<HTMLButtonElement>('.buy')!.click();
    await fixture.whenStable();

    expect(dialog()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/checkout', 2]);
  });

  it('goes to the order page from Buy in the details', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    element().querySelectorAll<HTMLElement>('.listing')[1].click();
    await fixture.whenStable();
    dialog()!.querySelector<HTMLButtonElement>('.buy')!.click();

    expect(navigate).toHaveBeenCalledWith(['/checkout', 2]);
  });

  it('links from the card details to the seller’s profile', async () => {
    element().querySelectorAll<HTMLElement>('.listing')[1].click();
    await fixture.whenStable();

    const link = dialog()!.querySelector('.seller-link')!;
    expect(link.textContent).toContain('View seller profile');
    expect(link.getAttribute('href')).toBe('/sellers/seller2');
  });

  it('links to the user’s own profile from their own card', async () => {
    element().querySelector<HTMLElement>('.listing')!.click();
    await fixture.whenStable();

    const link = dialog()!.querySelector('.seller-link')!;
    expect(link.textContent).toContain('View your profile');
    expect(link.getAttribute('href')).toBe('/profile');
  });

  describe('similar cards under the search', () => {
    const section = () => element().querySelector('app-similar-cards .similar');
    const tileNames = () =>
      Array.from(element().querySelectorAll('app-similar-cards .tile .name')).map((name) => name.textContent);

    async function type(text: string) {
      const search = element().querySelector<HTMLInputElement>('.search')!;
      search.value = text;
      search.dispatchEvent(new Event('input'));
      // The suggestions wait for the user to stop typing.
      await new Promise((resolve) => setTimeout(resolve, SIMILAR_SEARCH_DELAY_MS + 50));
      await fixture.whenStable();
    }

    it('shows nothing until the user searches', () => {
      expect(section()).toBeNull();
    });

    it("suggests other users' cards like the search, without the cards that already match", async () => {
      await type('Sample Card 02');

      expect(section()?.querySelector('.title')?.textContent).toContain('Similar to “Sample Card 02”');
      expect(tileNames().length).toBeGreaterThan(0);
      expect(tileNames().length).toBeLessThanOrEqual(4);
      expect(tileNames()).not.toContain('Sample Card 02');
      // seller1 is logged in, so their own cards (01, 03, 06) are not suggested.
      expect(tileNames().some((name) => ['Sample Card 01', 'Sample Card 03', 'Sample Card 06'].includes(name!))).toBe(false);
      expect(section()?.querySelector('.match')?.textContent).toMatch(/\d+% match/);
    });

    it('opens a suggested card in the card details', async () => {
      await type('Sample Card 02');
      const first = element().querySelector<HTMLButtonElement>('app-similar-cards .tile')!;
      const name = first.querySelector('.name')!.textContent;

      first.click();
      await fixture.whenStable();

      expect(dialog()?.querySelector('.name')?.textContent).toBe(name);
    });

    it('sends the chosen element with the search', async () => {
      const getSimilar = vi.spyOn(TestBed.inject(CardService), 'getSimilar');
      Array.from(element().querySelectorAll<HTMLButtonElement>('.chip'))
        .find((button) => button.textContent === 'Water')!
        .click();
      await type('Sample');

      expect(getSimilar).toHaveBeenLastCalledWith('Sample', 'Water');
    });

    it('says when nobody is selling the card searched for', async () => {
      let card!: CardListing;
      TestBed.inject(CardService)
        .getListings()
        .subscribe((listings) => (card = listings[0]))
        .unsubscribe();
      vi.spyOn(TestBed.inject(CardService), 'getSimilar').mockReturnValue(
        of({ basedOn: 'catalog', matches: 12, cards: [{ card, similarity: 0.78 }] })
      );
      await type('ลิซาร์ดอน');

      expect(element().textContent).toContain('No cards match your search');
      expect(section()?.querySelector('.title')?.textContent).toContain('Nobody is selling “ลิซาร์ดอน” right now');
      expect(section()?.querySelector('.match')?.textContent).toContain('78% match');
    });

    it('no longer shows similar cards in the card details', async () => {
      element().querySelector<HTMLElement>('.listing')!.click();
      await fixture.whenStable();

      expect(dialog()?.querySelector('app-similar-cards')).toBeNull();
    });
  });

  it('shows the user their own listings instead of a Buy button', async () => {
    const first = element().querySelector('.listing')!;
    expect(first.querySelector('.buy')).toBeNull();
    expect(first.querySelector('.own')?.textContent).toContain('Your listing');

    (first as HTMLElement).click();
    await fixture.whenStable();

    expect(dialog()!.querySelector('.buy')).toBeNull();
    expect(dialog()!.textContent).toContain('This is your listing');
  });
});
