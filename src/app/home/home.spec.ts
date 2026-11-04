import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;

  const element = () => fixture.nativeElement as HTMLElement;
  const names = () => Array.from(element().querySelectorAll('.name')).map((name) => name.textContent);

  beforeEach(async () => {
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
});
