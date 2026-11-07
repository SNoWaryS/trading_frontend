import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_URL } from '../api';
import { CatalogCard } from '../cards/card-catalog';
import { CardListing } from '../cards/card-listing';
import { CATALOG_SEARCH_LIMIT } from '../cards/catalog.service';
import { AddCard, SEARCH_DELAY_MS } from './add-card';
import { signIn } from '../testing/session';

function catalogCard(catalogId: number, cardName: string, overrides: Partial<CatalogCard> = {}): CatalogCard {
  return {
    catalogId,
    cardName,
    setName: 'เงามืดคุกคาม',
    cardNumber: `${String(catalogId).padStart(3, '0')}/164`,
    cardType: 'โปเกมอน',
    rarity: 'C',
    cardStage: 'พื้นฐาน',
    cardElement: 'น้ำ',
    cardPicture: `https://example.test/${catalogId}.png`,
    referencePrice: 100,
    ...overrides,
  };
}

const KEROMATSU = catalogCard(36, 'เคโรมัตซึ', { rarity: 'SR', referencePrice: 2100 });
const GEKKOGA = catalogCard(37, 'เกโคกาชิระ', { cardStage: 'ร่าง 1', referencePrice: 5 });

describe('AddCard', () => {
  let fixture: ComponentFixture<AddCard>;
  let closed: ReturnType<typeof vi.fn<() => void>>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;
  const alert = () => element().querySelector('[role=alert]')?.textContent;
  const resultNames = () => Array.from(element().querySelectorAll('.result-name')).map((name) => name.textContent);

  const waitForSearch = () => new Promise((resolve) => setTimeout(resolve, SEARCH_DELAY_MS + 20));

  // Waits for the form to ask the API, checks what it asked for, and answers.
  async function answerSearch(term: string, answer: (request: TestRequest) => void) {
    await fixture.whenStable();
    await waitForSearch();
    const request = http.expectOne((r) => r.url === `${API_URL}/api/catalog`);
    expect(request.request.params.get('search')).toBe(term);
    expect(request.request.params.get('limit')).toBe(String(CATALOG_SEARCH_LIMIT));
    answer(request);
    await fixture.whenStable();
  }

  function type(term: string) {
    const box = element().querySelector<HTMLInputElement>('input[type=search]')!;
    box.value = term;
    box.dispatchEvent(new Event('input'));
  }

  async function search(term: string, cards: CatalogCard[]) {
    type(term);
    await answerSearch(term.trim(), (request) => request.flush(cards));
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

  const LISTINGS = `${API_URL}/api/listings`;

  function listingRequest(): TestRequest {
    const request = http.expectOne(LISTINGS);
    expect(request.request.method).toBe('POST');
    return request;
  }

  // What the API answers after listing a catalog card.
  function listingOf(card: CatalogCard, listing: Partial<CardListing>): CardListing {
    return {
      cardId: 100,
      catalogId: card.catalogId,
      cardName: card.cardName,
      sellerName: 'seller1',
      cardType: card.cardType,
      rarity: card.rarity,
      referencePrice: card.referencePrice,
      cardPrice: 1,
      cardStage: card.cardStage,
      cardElement: card.cardElement,
      cardPicture: card.cardPicture,
      cardDescription: null,
      ...listing,
    };
  }

  beforeEach(async () => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:photo');
    URL.revokeObjectURL = vi.fn();

    await TestBed.configureTestingModule({
      imports: [AddCard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    signIn();

    fixture = TestBed.createComponent(AddCard);
    closed = vi.fn<() => void>();
    fixture.componentInstance.closed.subscribe(closed);
    await fixture.whenStable();
    // Until the API answers, the form says it is loading.
    expect(element().querySelector('.no-results')?.textContent).toContain('Loading the catalog');
    // Before the seller types anything, the form shows the first catalog cards.
    await answerSearch('', (request) => request.flush([KEROMATSU, GEKKOGA]));
  });

  afterEach(() => http.verify());

  it('shows the first catalog cards before searching', () => {
    expect(resultNames()).toEqual(['เคโรมัตซึ', 'เกโคกาชิระ']);
    expect(element().querySelector('.result-meta')?.textContent).toContain('เงามืดคุกคาม 036/164');
  });

  it('asks the API for the trimmed search term once the seller stops typing', async () => {
    await search('  036/164 ', [KEROMATSU]);
    expect(resultNames()).toEqual(['เคโรมัตซึ']);
  });

  it('says only catalog cards can be sold when nothing matches', async () => {
    await search('Charizard', []);

    expect(resultNames()).toEqual([]);
    expect(element().querySelector('.no-results')?.textContent).toContain('Only catalog cards can be sold');
  });

  it('says when only the first cards are shown', async () => {
    const many = Array.from({ length: CATALOG_SEARCH_LIMIT }, (_, i) => catalogCard(100 + i, `พิคาชู ${i}`));
    await search('พิคาชู', many);

    expect(resultNames().length).toBe(CATALOG_SEARCH_LIMIT);
    expect(element().textContent).toContain(`Showing the first ${CATALOG_SEARCH_LIMIT} cards`);
  });

  it('says when the catalog cannot be loaded', async () => {
    type('เค');
    await answerSearch('เค', (request) => request.flush(null, { status: 503, statusText: 'Unavailable' }));

    expect(alert()).toContain('Cannot load the catalog');
  });

  it('shows the chosen card with its reference price, and can change it', async () => {
    await pick('เคโรมัตซึ');

    const selected = element().querySelector('.selected')!;
    expect(selected.textContent).toContain('เคโรมัตซึ');
    expect(selected.textContent).toContain('2,100');
    expect(element().querySelector('input[type=search]')).toBeNull();

    element().querySelector<HTMLButtonElement>('.change')!.click();
    await fixture.whenStable();

    expect(element().querySelector('.selected')).toBeNull();
    expect(resultNames()).toEqual(['เคโรมัตซึ', 'เกโคกาชิระ']);
  });

  it('sends the chosen catalog card, price, description and photo to the listings API', async () => {
    await pick('เคโรมัตซึ');
    attachPhoto();
    fill({ cardPrice: '3500', cardDescription: '  Mint, kept in a sleeve  ' });
    await submit();

    const request = listingRequest();
    const form = request.request.body as FormData;
    expect(form.get('catalogId')).toBe('36');
    expect(form.get('cardPrice')).toBe('3500');
    expect(form.get('cardDescription')).toBe('Mint, kept in a sleeve');
    expect((form.get('photo') as File).name).toBe('card');
    expect(element().querySelector<HTMLButtonElement>('.primary')!.disabled).toBe(true);
    expect(closed).not.toHaveBeenCalled();

    request.flush(listingOf(KEROMATSU, { cardPrice: 3500, cardPicture: 'http://localhost:5041/uploads/listings/x.png' }));
    await fixture.whenStable();

    expect(closed).toHaveBeenCalled();
    // The listing shows the uploaded photo, so the preview is released.
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo');
  });

  it('accepts any price, however far it is from the reference price', async () => {
    await pick('เคโรมัตซึ');
    fill({ cardPrice: '1' });
    await submit();

    const request = listingRequest();
    expect((request.request.body as FormData).get('cardPrice')).toBe('1');
    request.flush(listingOf(KEROMATSU, { cardPrice: 1 }));
  });

  it('sends no photo when the seller adds none, so the catalog picture is used', async () => {
    await pick('เกโคกาชิระ');
    fill({ cardPrice: '900' });
    await submit();

    const request = listingRequest();
    const form = request.request.body as FormData;
    expect(form.has('photo')).toBe(false);
    expect(form.get('cardDescription')).toBe('');
    request.flush(listingOf(GEKKOGA, { cardPrice: 900 }));
  });

  it("shows the API's message and keeps the form open when listing fails", async () => {
    await pick('เคโรมัตซึ');
    fill({ cardPrice: '900' });
    await submit();

    listingRequest().flush({ message: 'This card is not in the catalog' }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();

    expect(alert()).toContain('This card is not in the catalog');
    expect(closed).not.toHaveBeenCalled();
    expect(element().querySelector<HTMLButtonElement>('.primary')!.disabled).toBe(false);
  });

  it('requires a catalog card', async () => {
    fill({ cardPrice: '900' });
    await submit();

    expect(alert()).toContain('choose a card from the catalog');
    http.expectNone(LISTINGS);
    expect(closed).not.toHaveBeenCalled();
  });

  it.each([
    ['', 'enter your price'],
    ['0', 'Price must be'],
    ['12.5', 'Price must be'],
  ])('rejects the price %j', async (price, message) => {
    await pick('เคโรมัตซึ');
    fill({ cardPrice: price });
    await submit();

    expect(alert()).toContain(message);
    http.expectNone(LISTINGS);
  });

  it('rejects files that are not supported pictures', async () => {
    attachPhoto('application/pdf');
    await fixture.whenStable();

    expect(alert()).toContain('JPG, PNG or WebP');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('adds nothing and releases the photo on cancel', async () => {
    await pick('เคโรมัตซึ');
    attachPhoto();
    fill({ cardPrice: '900' });
    element().querySelector<HTMLButtonElement>('.secondary')!.click();
    await fixture.whenStable();

    http.expectNone(LISTINGS);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo');
    expect(closed).toHaveBeenCalled();
  });
});
