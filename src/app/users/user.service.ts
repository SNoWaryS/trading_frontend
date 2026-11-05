import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ProfileChanges, UserProfile } from './user-profile';

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

@Injectable({ providedIn: 'root' })
export class UserService {
  // Sample user held in memory for now. Replace these methods with HttpClient calls once the app has sessions.
  private readonly user = new BehaviorSubject<UserProfile>(SAMPLE_CURRENT_USER);

  getCurrentUser(): Observable<UserProfile> {
    return this.user.asObservable();
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
