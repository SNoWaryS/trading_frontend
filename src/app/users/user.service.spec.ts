import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_URL } from '../api';
import { AuthService } from '../auth/auth.service';
import { SAMPLE_COLLECTOR, signIn } from '../testing/session';
import { UserService } from './user.service';

const USERS = `${API_URL}/api/users`;

describe('UserService', () => {
  let http: HttpTestingController;
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    signIn();
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(UserService);
  });

  afterEach(() => http.verify());

  it("loads a seller's public profile", async () => {
    const result = firstValueFrom(service.getPublicProfile('seller 2'));
    const seller = { userId: 2, name: 'มานี', surname: 'ใจดี', username: 'seller 2', email: 'm@test.local', phoneNumber: null };
    http.expectOne(`${USERS}/seller%202`).flush(seller);

    expect(await result).toEqual(seller);
  });

  it('gives undefined for a seller who does not exist', async () => {
    const result = firstValueFrom(service.getPublicProfile('nobody'));
    http.expectOne(`${USERS}/nobody`).flush({ message: 'This seller does not exist' }, { status: 404, statusText: 'Not Found' });

    expect(await result).toBeUndefined();
  });

  it('saves profile changes and updates the logged-in user', async () => {
    const changes = { name: 'มานี', surname: 'ใจดี', email: 'manee@test.local', phoneNumber: null, address: null };
    const result = firstValueFrom(service.updateProfile(changes));
    const request = http.expectOne(`${USERS}/me`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(changes);
    request.flush({ ...SAMPLE_COLLECTOR, ...changes });

    expect((await result).name).toBe('มานี');
    expect(TestBed.inject(AuthService).user()?.email).toBe('manee@test.local');
  });

  it("passes on the API's message when the profile cannot be saved", async () => {
    const result = firstValueFrom(service.updateProfile({ ...SAMPLE_COLLECTOR, email: 'taken@test.local' }));
    http
      .expectOne(`${USERS}/me`)
      .flush({ message: 'This email is already used by another account' }, { status: 409, statusText: 'Conflict' });

    await expect(result).rejects.toThrow('This email is already used by another account');
    expect(TestBed.inject(AuthService).user()?.email).toBe('seller1@test.local');
  });

  it('deletes the account with the password and clears the session', async () => {
    const result = firstValueFrom(service.deleteAccount('Test@1234'), { defaultValue: undefined });
    const request = http.expectOne(`${USERS}/me`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toEqual({ password: 'Test@1234' });
    request.flush(null, { status: 204, statusText: 'No Content' });

    await result;
    expect(TestBed.inject(AuthService).user()).toBeNull();
  });

  it('keeps the session when the account cannot be deleted', async () => {
    const result = firstValueFrom(service.deleteAccount('wrong'));
    http.expectOne(`${USERS}/me`).flush({ message: 'Incorrect password' }, { status: 400, statusText: 'Bad Request' });

    await expect(result).rejects.toThrow('Incorrect password');
    expect(TestBed.inject(AuthService).user()).not.toBeNull();
  });
});
