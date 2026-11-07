import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api';
import { signIn } from '../testing/session';
import { CardListing } from './card-listing';
import { CardService } from './card.service';

const LISTINGS = `${API_URL}/api/listings`;

function listing(cardId: number, sellerName: string, cardPrice = 100): CardListing {
  return {
    cardId,
    catalogId: cardId + 1000,
    cardName: `การ์ด ${cardId}`,
    sellerName,
    cardType: 'โปเกมอน',
    rarity: 'C',
    referencePrice: 50,
    cardPrice,
    cardStage: 'พื้นฐาน',
    cardElement: 'น้ำ',
    cardPicture: null,
    cardDescription: null,
  };
}

describe('CardService', () => {
  let http: HttpTestingController;
  let service: CardService;
  let shown: CardListing[] | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CardService);
    signIn();

    shown = undefined;
    service.getListings().subscribe((listings) => (shown = listings));
    http.expectOne(LISTINGS).flush([listing(2, 'seller1'), listing(1, 'seller2')]);
  });

  afterEach(() => http.verify());

  it('loads the listings from the API', () => {
    expect(shown?.map((card) => card.cardId)).toEqual([2, 1]);
  });

  it("filters the logged-in user's own listings", async () => {
    const mine = firstValueFrom(service.getMyListings());
    http.expectOne(LISTINGS).flush([listing(2, 'seller1'), listing(1, 'seller2')]);

    expect((await mine).map((card) => card.cardId)).toEqual([2]);
  });

  it('keeps showing the loaded listings when reloading fails', () => {
    service.getListings().subscribe();
    http.expectOne(LISTINGS).flush(null, { status: 503, statusText: 'Unavailable' });

    expect(shown?.map((card) => card.cardId)).toEqual([2, 1]);
  });

  it('posts a new listing as a form and shows it first', async () => {
    const photo = new File(['x'], 'card.png', { type: 'image/png' });
    const added = firstValueFrom(service.addListing({ catalogId: 7, cardPrice: 250, cardDescription: 'Mint', photo }));

    const request = http.expectOne(LISTINGS);
    expect(request.request.method).toBe('POST');
    const form = request.request.body as FormData;
    expect(form.get('catalogId')).toBe('7');
    expect(form.get('cardPrice')).toBe('250');
    expect(form.get('cardDescription')).toBe('Mint');
    expect(form.get('photo')).toBe(photo);
    request.flush(listing(3, 'seller1', 250));

    expect((await added).cardId).toBe(3);
    expect(shown?.map((card) => card.cardId)).toEqual([3, 2, 1]);
  });

  it('saves changes to a listing', async () => {
    const saved = firstValueFrom(service.updateListing(2, { cardPrice: 999, cardDescription: null }));

    const request = http.expectOne(`${LISTINGS}/2`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ cardPrice: 999, cardDescription: null });
    request.flush(listing(2, 'seller1', 999));

    await saved;
    expect(shown?.find((card) => card.cardId === 2)?.cardPrice).toBe(999);
  });

  it('removes a listing', async () => {
    const removed = firstValueFrom(service.removeListing(2));

    const request = http.expectOne(`${LISTINGS}/2`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    await removed;
    expect(shown?.map((card) => card.cardId)).toEqual([1]);
  });

  it("passes on the API's error message", async () => {
    const removed = firstValueFrom(service.removeListing(2));
    http
      .expectOne(`${LISTINGS}/2`)
      .flush({ message: 'Someone has ordered this card, so it cannot be removed' }, { status: 409, statusText: 'Conflict' });

    await expect(removed).rejects.toThrow('Someone has ordered this card');
    expect(shown?.map((card) => card.cardId)).toEqual([2, 1]);
  });
});
