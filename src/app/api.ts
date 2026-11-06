import { HttpInterceptorFn } from '@angular/common/http';

export const API_URL = 'http://localhost:5041';

// Sends the session cookie with every request to the API (it is on another port, so the browser needs to be told).
export const credentialsInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.url.startsWith(API_URL) ? request.clone({ withCredentials: true }) : request);
