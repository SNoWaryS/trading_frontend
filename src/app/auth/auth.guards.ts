import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Pages for logged-in users. Anyone else goes to the login page.
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.restore()) ? true : router.createUrlTree(['/login']);
};

// The login and register pages. A logged-in user goes straight to the home page.
// They are prerendered at build time, where there is no session, so the check runs only in the browser.
export const guestGuard: CanActivateFn = async () => {
  if (isPlatformServer(inject(PLATFORM_ID))) {
    return true;
  }
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.restore()) ? router.createUrlTree(['/home']) : true;
};
