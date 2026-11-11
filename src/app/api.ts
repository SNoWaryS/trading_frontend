import { HttpInterceptorFn } from '@angular/common/http';

export const API_URL = 'http://localhost:5041';

export const credentialsInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.url.startsWith(API_URL) ? request.clone({ withCredentials: true }) : request);
