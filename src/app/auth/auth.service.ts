import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, finalize, firstValueFrom, map, Observable, of, tap } from 'rxjs';
import { API_URL } from '../api';
import { UserProfile } from '../users/user-profile';

// The logged-in user. The session itself is an HttpOnly cookie the API sets, so this only mirrors it.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = new BehaviorSubject<UserProfile | null>(null);
  private restoring: Promise<UserProfile | null> | null = null;

  readonly user$ = this.session.asObservable();
  readonly user = toSignal(this.session, { requireSync: true });

  username(): string | null {
    return this.session.value?.username ?? null;
  }

  // Asks the API who is logged in, once per page load. Any failure counts as logged out.
  restore(): Promise<UserProfile | null> {
    if (this.session.value) {
      return Promise.resolve(this.session.value);
    }
    this.restoring ??= firstValueFrom(
      this.http.get<UserProfile>(`${API_URL}/api/auth/me`).pipe(catchError(() => of(null)))
    ).then((user) => {
      this.session.next(user);
      return user;
    });
    return this.restoring;
  }

  login(username: string, password: string): Observable<UserProfile> {
    return this.http
      .post<UserProfile>(`${API_URL}/api/auth/login`, { username, password })
      .pipe(tap((user) => this.setSession(user)));
  }

  // Clears the session here even if the API cannot be reached.
  logout(): Observable<void> {
    return this.http.post<void>(`${API_URL}/api/auth/logout`, null).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => this.setSession(null))
    );
  }

  setSession(user: UserProfile | null): void {
    this.restoring = Promise.resolve(user);
    this.session.next(user);
  }
}
