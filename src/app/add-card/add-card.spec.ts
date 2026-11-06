import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardListing } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { AddCard } from './add-card';

describe('AddCard', () => {
  let fixture: ComponentFixture<AddCard>;
  let closed: ReturnType<typeof vi.fn<() => void>>;

  const element = () => fixture.nativeElement as HTMLElement;
  const alert = () => element().querySelector('[role=alert]')?.textContent;
  const resultNames = () => Array.from(element().querySelectorAll('.result-name')).map((name) => name.textContent);

  async function search(term: string) {
    const box = element().querySelector<HTMLInputElement>('input[type=search]')!;
    box.value = term;
    box.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function pick(name: string) {
    Array.from(element().querySelectorAll<HTMLButtonElement>('.result'))
      .find((button) => button.querySelector('.result-name')?.textContent === name)!
      .click();
    await fixture.whenStable();
  }

  function fill(values: Record<string, string>) {
    for (const [id, value] of Object.entries(values)) {
      const field = element().querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
      field.value = value;
      field.dispatchEvent(new Event('input'));
    }
  }

  function attachPhoto(type = 'image/png') {
    const input = element().querySelector<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'card', { type })], configurable: true });
    input.dispatchEvent(new Event('change'));
  }

  async function submit() {
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function myListings() {
    let listings: CardListing[] = [];
    TestBed.inject(CardService)
      .getMyListings()
      .subscribe((value) => (listings = value));
    return listings;
  }

  beforeEach(async () => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:photo');
    URL.revokeObjectURL = vi.fn();

    await TestBed.configureTestingModule({ imports: [AddCard] }).compileComponents();

    fixture = TestBed.createComponent(AddCard);
    closed = vi.fn<() => void>();
    fixture.componentInstance.closed.subscribe(closed);
    await fixture.whenStable();
  });

  it('lists the whole catalog before searching', () => {
    expect(resultNames().length).toBe(12);
  });

  it('searches the catalog by name, set or number', async () => {
    await search('card 1');
    expect(resultNames()).toEqual(['Sample Card 10', 'Sample Card 11', 'Sample Card 12']);

    await search('009/100');
    expect(resultNames()).toEqual(['Sample Card 09']);

    await search('sample set');
    expect(resultNames().length).toBe(12);
  });

  it('says only catalog cards can be sold when nothing matches', async () => {
    await search('Charizard');

    expect(resultNames()).toEqual([]);
    expect(element().querySelector('.no-results')?.textContent).toContain('Only catalog cards can be sold');
  });

  it('shows the chosen card with its reference price, and can change it', async () => {
    await pick('Sample Card 09');

    const selected = element().querySelector('.selected')!;
    expect(selected.textContent).toContain('Sample Card 09');
    expect(selected.textContent).toContain('2,100');
    expect(element().querySelector('input[type=search]')).toBeNull();

    element().querySelector<HTMLButtonElement>('.change')!.click();
    await fixture.whenStable();

    expect(element().querySelector('.selected')).toBeNull();
    expect(resultNames().length).toBe(12);
  });

  it('lists the chosen catalog card with the details taken from the catalog', async () => {
    const before = myListings().length;

    await pick('Sample Card 09');
    attachPhoto();
    fill({ cardPrice: '3500', cardDescription: '  Mint, kept in a sleeve  ' });
    await submit();

    const listings = myListings();
    expect(listings.length).toBe(before + 1);
    expect(listings[0]).toMatchObject({
      catalogId: 9,
      cardName: 'Sample Card 09',
      cardType: 'Pokémon',
      rarity: 'SR',
      cardElement: 'Fighting',
      cardStage: 'Stage 1',
      referencePrice: 2100,
      cardPrice: 3500,
      cardPicture: 'blob:photo',
      cardDescription: 'Mint, kept in a sleeve',
      sellerName: 'seller1',
    });
    expect(closed).toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('accepts any price, however far it is from the reference price', async () => {
    await pick('Sample Card 09');
    fill({ cardPrice: '1' });
    await submit();

    expect(myListings()[0]).toMatchObject({ catalogId: 9, cardPrice: 1 });
  });

  it('uses the catalog picture when the seller adds no photo', async () => {
    await pick('Sample Card 10');
    fill({ cardPrice: '900' });
    await submit();

    expect(myListings()[0]).toMatchObject({ catalogId: 10, cardPicture: 'Frogg_login.jpg', cardDescription: null });
  });

  it('requires a catalog card', async () => {
    const before = myListings().length;

    fill({ cardPrice: '900' });
    await submit();

    expect(alert()).toContain('choose a card from the catalog');
    expect(myListings().length).toBe(before);
    expect(closed).not.toHaveBeenCalled();
  });

  it.each([
    ['', 'enter your price'],
    ['0', 'Price must be'],
    ['12.5', 'Price must be'],
  ])('rejects the price %j', async (price, message) => {
    const before = myListings().length;

    await pick('Sample Card 09');
    fill({ cardPrice: price });
    await submit();

    expect(alert()).toContain(message);
    expect(myListings().length).toBe(before);
  });

  it('rejects files that are not supported pictures', async () => {
    attachPhoto('application/pdf');
    await fixture.whenStable();

    expect(alert()).toContain('JPG, PNG or WebP');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('adds nothing and releases the photo on cancel', async () => {
    const before = myListings().length;

    await pick('Sample Card 09');
    attachPhoto();
    fill({ cardPrice: '900' });
    element().querySelector<HTMLButtonElement>('.secondary')!.click();
    await fixture.whenStable();

    expect(myListings().length).toBe(before);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo');
    expect(closed).toHaveBeenCalled();
  });
});
