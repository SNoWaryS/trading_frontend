import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Home } from './home';

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
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
  });

  it('lists the cards for sale with their prices', () => {
    expect(names().length).toBe(8);
    expect(element().querySelector('.price')?.textContent).toContain('1,250');
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
