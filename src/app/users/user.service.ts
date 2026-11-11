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

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  getCurrentUser(): Observable<UserProfile> {
    return this.auth.user$.pipe(filter((user): user is UserProfile => user !== null));
  }

  getPublicProfile(username: string): Observable<PublicProfile | undefined> {
    return this.http.get<PublicProfile>(`${USERS_URL}/${encodeURIComponent(username)}`).pipe(
      catchError((error: HttpErrorResponse) => (error.status === 404 ? of(undefined) : throwError(() => error)))
    );
  }

  updateProfile(changes: ProfileChanges): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${USERS_URL}/me`, changes).pipe(
      tap((user) => this.auth.setSession(user)),
      catchError(apiError('Cannot save your profile right now. Please try again.'))
    );
  }

  deleteAccount(password: string): Observable<void> {
    return this.http.delete<void>(`${USERS_URL}/me`, { body: { password } }).pipe(
      tap(() => this.auth.setSession(null)),
      map(() => undefined),
      catchError(apiError('Cannot delete your account right now. Please try again.'))
    );
  }
}
