import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { UserProfile } from '../users/user-profile';

// The seller1 test account, which owns the sample listings, orders and reviews.
export const SAMPLE_COLLECTOR: UserProfile = {
  userId: 1,
  name: 'Sample',
  surname: 'Collector',
  username: 'seller1',
  email: 'seller1@test.local',
  phoneNumber: null,
  address: '123 Sample Road, Bangkok 10100',
};

// For tests: acts as if this user has logged in. Call after configuring the TestBed.
export function signIn(user: UserProfile = SAMPLE_COLLECTOR): void {
  TestBed.inject(AuthService).setSession(user);
}
