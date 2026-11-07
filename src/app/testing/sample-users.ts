import { inject, Injectable, Provider } from '@angular/core';
import { filter, Observable, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ProfileChanges, PublicProfile, UserProfile } from '../users/user-profile';
import { UserService } from '../users/user.service';

// For tests: users held in memory instead of the profile API. The sellers of the sample listings in ./sample-cards.
const SAMPLE_SELLERS: PublicProfile[] = [
  { userId: 1, name: 'Sample', surname: 'Collector', username: 'seller1', email: 'seller1@test.local', phoneNumber: null },
  ...[2, 3, 4, 5, 6, 7, 8].map((id) => ({
    userId: id,
    name: 'Sample',
    surname: `Seller ${id}`,
    username: `seller${id}`,
    email: `seller${id}@test.local`,
    // Only seller2 has a phone number, so the page shows both cases. 000 is not a real Thai prefix.
    phoneNumber: id === 2 ? '000-000-0002' : null,
  })),
];

// The password every sample account has here, like Test@1234 in the database seed.
export const SAMPLE_PASSWORD = 'Test@1234';

@Injectable()
export class SampleUserService implements Pick<UserService, keyof UserService> {
  private readonly auth = inject(AuthService);

  getCurrentUser(): Observable<UserProfile> {
    return this.auth.user$.pipe(filter((user): user is UserProfile => user !== null));
  }

  getPublicProfile(username: string): Observable<PublicProfile | undefined> {
    const current = this.auth.user();
    const seller = current?.username === username ? current : SAMPLE_SELLERS.find((item) => item.username === username);
    if (!seller) {
      return of(undefined);
    }
    const { userId, name, surname, email, phoneNumber } = seller;
    return of({ userId, name, surname, username, email, phoneNumber });
  }

  updateProfile(changes: ProfileChanges): Observable<UserProfile> {
    const user = this.auth.user();
    if (!user) {
      return throwError(() => new Error('Please log in to edit your profile'));
    }
    if (SAMPLE_SELLERS.some((seller) => seller.userId !== user.userId && seller.email === changes.email)) {
      return throwError(() => new Error('This email is already used by another account'));
    }
    const updated = { ...user, ...changes };
    this.auth.setSession(updated);
    return of(updated);
  }

  deleteAccount(password: string): Observable<void> {
    if (password !== SAMPLE_PASSWORD) {
      return throwError(() => new Error('Incorrect password'));
    }
    this.auth.setSession(null);
    return of(undefined);
  }
}

export function provideSampleUsers(): Provider[] {
  return [{ provide: UserService, useClass: SampleUserService }];
}
