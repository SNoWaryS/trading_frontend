import { inject, Injectable } from '@angular/core';
import { filter, map, Observable, of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ProfileChanges, PublicProfile, UserProfile } from './user-profile';

// The sample sellers in the card listings. seller1 is also a real test account (see back/seed_test_user.sql).
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

function toPublic({ userId, name, surname, username, email, phoneNumber }: PublicProfile): PublicProfile {
  return { userId, name, surname, username, email, phoneNumber };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly auth = inject(AuthService);

  // The logged-in user, loaded from the API at login.
  getCurrentUser(): Observable<UserProfile> {
    return this.auth.user$.pipe(filter((user): user is UserProfile => user !== null));
  }

  // Public details only: buyers see a seller's email and phone number for contact, never their address.
  // The logged-in user's real details replace the sample ones when they are a sample seller too.
  getPublicProfile(username: string): Observable<PublicProfile | undefined> {
    return this.auth.user$.pipe(
      map((current) => {
        const sellers = current ? [current, ...SAMPLE_SELLERS] : SAMPLE_SELLERS;
        const seller = sellers.find((profile) => profile.username === username);
        return seller && toPublic(seller);
      })
    );
  }

  // Changes the details shown in this browser only. The API to save them is not built yet.
  updateProfile(changes: ProfileChanges): Observable<UserProfile> {
    const user = this.auth.user();
    if (!user) {
      return throwError(() => new Error('Please log in to edit your profile'));
    }
    const updated = { ...user, ...changes };
    this.auth.setSession(updated);
    return of(updated);
  }

  // The API should block sign-in now and remove the account and its activity 30 days after its last order ends.
  deleteAccount(): Observable<void> {
    return of(undefined);
  }
}
