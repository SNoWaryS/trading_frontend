import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { API_URL, credentialsInterceptor } from '../api';
import { SAMPLE_COLLECTOR } from '../testing/session';
import { authGuard, guestGuard } from './auth.guards';
import { AuthService } from './auth.service';

@Component({ template: 'page' })
class Page {}

const ME = `${API_URL}/api/auth/me`;

describe('session', () => {
  let http: HttpTestingController;

  function setUp(platform = 'browser') {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: platform },
        provideRouter([
          { path: 'login', component: Page, canActivate: [guestGuard] },
          { path: 'home', component: Page, canActivate: [authGuard] },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  }

  const auth = () => TestBed.inject(AuthService);
  const router = () => TestBed.inject(Router);
  // Guards run asynchronously, so let the navigation reach the guard before checking its request.
  const tick = () => new Promise((resolve) => setTimeout(resolve));

  afterEach(() => http.verify());

  describe('AuthService', () => {
    beforeEach(() => setUp());

    it('logs in and keeps the returned user', () => {
      let result: unknown;
      auth().login('seller1', 'secret').subscribe((user) => (result = user));

      const request = http.expectOne(`${API_URL}/api/auth/login`);
      expect(request.request.body).toEqual({ username: 'seller1', password: 'secret' });
      expect(request.request.withCredentials).toBe(true);
      request.flush(SAMPLE_COLLECTOR);

      expect(result).toEqual(SAMPLE_COLLECTOR);
      expect(auth().user()).toEqual(SAMPLE_COLLECTOR);
      expect(auth().username()).toBe('seller1');
    });

    it('restores the session from the API once', async () => {
      const first = auth().restore();
      const second = auth().restore();
      const request = http.expectOne(ME);
      expect(request.request.withCredentials).toBe(true);
      request.flush(SAMPLE_COLLECTOR);

      expect(await first).toEqual(SAMPLE_COLLECTOR);
      expect(await second).toEqual(SAMPLE_COLLECTOR);
      expect(await auth().restore()).toEqual(SAMPLE_COLLECTOR);
    });

    it('treats a 401 from the API as logged out', async () => {
      const restored = auth().restore();
      http.expectOne(ME).flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(await restored).toBeNull();
      expect(auth().user()).toBeNull();
    });

    it('logs out, and forgets the user even when the API cannot be reached', () => {
      auth().setSession(SAMPLE_COLLECTOR);

      let done = false;
      auth().logout().subscribe(() => (done = true));
      http.expectOne(`${API_URL}/api/auth/logout`).error(new ProgressEvent('error'));

      expect(done).toBe(true);
      expect(auth().user()).toBeNull();
    });

    it('does not ask the API again after logging out', async () => {
      auth().setSession(SAMPLE_COLLECTOR);
      auth().logout().subscribe();
      http.expectOne(`${API_URL}/api/auth/logout`).flush(null);

      expect(await auth().restore()).toBeNull();
      http.expectNone(ME);
    });

    it('sends the cookie only to the API', () => {
      TestBed.inject(HttpClient).get('https://example.com/other').subscribe();

      expect(http.expectOne('https://example.com/other').request.withCredentials).toBe(false);
    });
  });

  describe('guards', () => {
    it('sends a logged-out user from a protected page to login', async () => {
      setUp();
      const navigation = router().navigateByUrl('/home');
      await tick();
      http.expectOne(ME).flush(null, { status: 401, statusText: 'Unauthorized' });
      await navigation;

      expect(router().url).toBe('/login');
    });

    it('lets a logged-in user open a protected page', async () => {
      setUp();
      const navigation = router().navigateByUrl('/home');
      await tick();
      http.expectOne(ME).flush(SAMPLE_COLLECTOR);
      await navigation;

      expect(router().url).toBe('/home');
    });

    it('sends a logged-in user from login to home', async () => {
      setUp();
      auth().setSession(SAMPLE_COLLECTOR);
      await router().navigateByUrl('/login');

      expect(router().url).toBe('/home');
    });

    it('lets the login page prerender without asking the API', async () => {
      setUp('server');
      await router().navigateByUrl('/login');

      http.expectNone(ME);
      expect(router().url).toBe('/login');
    });
  });
});
