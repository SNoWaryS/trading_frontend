import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, filter, map, Observable, of, tap, throwError } from 'rxjs';
import { API_URL } from '../api';
import { AuthService } from '../auth/auth.service';
import { ProfileChanges, PublicProfile, UserProfile } from './user-profile';

const USERS_URL = `${API_URL}/api/users`;

function apiError(fallback: string) {
  return (error: HttpErrorResponse) =>
    throwError(() => new Error(typeof error.error?.message === 'string' ? error.error.message : fallback));
}

// Users (the USERS table), through the profile API.
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  // The logged-in user, loaded from the API at login.
  getCurrentUser(): Observable<UserProfile> {
    return this.auth.user$.pipe(filter((user): user is UserProfile => user !== null));
  }

  // Public details only: buyers see a seller's email and phone number for contact, never their address.
  // undefined when nobody has this username or the account was deleted.
  getPublicProfile(username: string): Observable<PublicProfile | undefined> {
    return this.http.get<PublicProfile>(`${USERS_URL}/${encodeURIComponent(username)}`).pipe(
      catchError((error: HttpErrorResponse) => (error.status === 404 ? of(undefined) : throwError(() => error)))
    );
  }

  // Saves the changes, then shows them everywhere the logged-in user appears.
  updateProfile(changes: ProfileChanges): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${USERS_URL}/me`, changes).pipe(
      tap((user) => this.auth.setSession(user)),
      catchError(apiError('Cannot save your profile right now. Please try again.'))
    );
  }

  // Needs the user's password. The API signs them out, blocks sign-in from now on, and removes the account and its
  // activity 30 days later. It refuses while one of their orders is still pending or shipped.
  deleteAccount(password: string): Observable<void> {
    return this.http.delete<void>(`${USERS_URL}/me`, { body: { password } }).pipe(
      tap(() => this.auth.setSession(null)),
      map(() => undefined),
      catchError(apiError('Cannot delete your account right now. Please try again.'))
    );
  }
}
