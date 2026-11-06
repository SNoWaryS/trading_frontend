import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { ProfileChanges, PublicProfile, UserProfile } from './user-profile';

// The sample user that the sell, order and review sample data belong to.
const SAMPLE_CURRENT_USER: UserProfile = {
  userId: 1,
  name: 'Sample',
  surname: 'Collector',
  username: 'seller1',
  email: 'seller1@test.local',
  phoneNumber: null,
  address: '123 Sample Road, Bangkok 10100',
};

// The other sample sellers in the card listings (seller2 to seller8).
const SAMPLE_SELLERS: PublicProfile[] = [2, 3, 4, 5, 6, 7, 8].map((id) => ({
  userId: id,
  name: 'Sample',
  surname: `Seller ${id}`,
  username: `seller${id}`,
  email: `seller${id}@test.local`,
  // Only seller2 has a phone number, so the page shows both cases. 000 is not a real Thai prefix.
  phoneNumber: id === 2 ? '000-000-0002' : null,
}));

@Injectable({ providedIn: 'root' })
export class UserService {
  // Sample users held in memory for now. Replace these methods with HttpClient calls once the app has sessions.
  private readonly user = new BehaviorSubject<UserProfile>(SAMPLE_CURRENT_USER);

  getCurrentUser(): Observable<UserProfile> {
    return this.user.asObservable();
  }

  // Public details only: buyers see a seller's email and phone number for contact, never their address.
  getPublicProfile(username: string): Observable<PublicProfile | undefined> {
    return this.user.pipe(
      map((current) =>
        [current, ...SAMPLE_SELLERS]
          .map(({ userId, name, surname, username, email, phoneNumber }) => ({
            userId,
            name,
            surname,
            username,
            email,
            phoneNumber,
          }))
          .find((profile) => profile.username === username)
      )
    );
  }

  updateProfile(changes: ProfileChanges): Observable<UserProfile> {
    const updated = { ...this.user.value, ...changes };
    this.user.next(updated);
    return of(updated);
  }

  // The API should block sign-in now and remove the account and its activity 30 days after its last order ends.
  deleteAccount(): Observable<void> {
    return of(undefined);
  }
}
