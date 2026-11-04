import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardListing } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { AddCard } from './add-card';

describe('AddCard', () => {
  let fixture: ComponentFixture<AddCard>;
  let closed: ReturnType<typeof vi.fn<() => void>>;

  const element = () => fixture.nativeElement as HTMLElement;
  const alert = () => element().querySelector('[role=alert]')?.textContent;

  function fill(values: Record<string, string>) {
    for (const [id, value] of Object.entries(values)) {
      const field = element().querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)!;
      field.value = value;
      field.dispatchEvent(new Event(field.tagName === 'SELECT' ? 'change' : 'input'));
    }
  }

  function choosePicture(type = 'image/png', bytes = 10) {
    const input = element().querySelector<HTMLInputElement>('input[type=file]')!;
    const file = new File([new Uint8Array(bytes)], 'card', { type });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
  }

  async function submit() {
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  async function myListings() {
    let listings: CardListing[] = [];
    TestBed.inject(CardService)
      .getMyListings()
      .subscribe((value) => (listings = value));
    return listings;
  }

  const required = { cardName: 'Froakie', rarity: 'AR', cardPrice: '1500' };

  beforeEach(async () => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:picture');
    URL.revokeObjectURL = vi.fn();

    await TestBed.configureTestingModule({ imports: [AddCard] }).compileComponents();

    fixture = TestBed.createComponent(AddCard);
    closed = vi.fn<() => void>();
    fixture.componentInstance.closed.subscribe(closed);
    await fixture.whenStable();
  });

  it('adds the card to the listings and closes', async () => {
    const before = (await myListings()).length;

    choosePicture();
    fill({ ...required, cardElement: 'Water', referencePrice: '1600', cardDescription: 'Mint' });
    await submit();

    const listings = await myListings();
    expect(listings.length).toBe(before + 1);
    expect(listings[0]).toMatchObject({
      cardName: 'Froakie',
      cardType: 'Pokémon',
      rarity: 'AR',
      cardElement: 'Water',
      cardStage: null,
      cardPrice: 1500,
      referencePrice: 1600,
      cardDescription: 'Mint',
      cardPicture: 'blob:picture',
      sellerName: 'seller1',
    });
    expect(closed).toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('stores empty optional fields as null', async () => {
    choosePicture();
    fill(required);
    await submit();

    expect((await myListings())[0]).toMatchObject({
      cardElement: null,
      cardStage: null,
      referencePrice: null,
      cardDescription: null,
    });
  });

  it('requires a picture', async () => {
    const before = (await myListings()).length;

    fill(required);
    await submit();

    expect(alert()).toContain('picture');
    expect((await myListings()).length).toBe(before);
    expect(closed).not.toHaveBeenCalled();
  });

  it.each([
    [{ cardName: '   ' }, 'required'],
    [{ rarity: '' }, 'required'],
    [{ cardPrice: '' }, 'required'],
    [{ cardPrice: '0' }, 'Price must be'],
    [{ cardPrice: '12.5' }, 'Price must be'],
    [{ referencePrice: '12.5' }, 'Reference price must be'],
  ])('rejects %j', async (override, message) => {
    const before = (await myListings()).length;

    choosePicture();
    fill({ ...required, ...override });
    await submit();

    expect(alert()).toContain(message);
    expect((await myListings()).length).toBe(before);
  });

  it('rejects files that are not supported pictures', async () => {
    choosePicture('application/pdf');
    await fixture.whenStable();

    expect(alert()).toContain('JPG, PNG or WebP');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('rejects pictures over 5 MB', async () => {
    choosePicture('image/png', 5 * 1024 * 1024 + 1);
    await fixture.whenStable();

    expect(alert()).toContain('5 MB');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('adds nothing and releases the picture on cancel', async () => {
    const before = (await myListings()).length;

    choosePicture();
    fill(required);
    element().querySelector<HTMLButtonElement>('.secondary')!.click();
    await fixture.whenStable();

    expect((await myListings()).length).toBe(before);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:picture');
    expect(closed).toHaveBeenCalled();
  });
});
