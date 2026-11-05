import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UserProfile } from './user-profile';

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
  // Sample user for now. Load the logged-in user from the API once the app has sessions.
  getCurrentUser(): Observable<UserProfile> {
    return of(SAMPLE_CURRENT_USER);
  }
}
