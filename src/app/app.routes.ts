import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guards';
import { Login } from './login/login';
import { Register } from './register/register';

// Login and register load with the app. The pages behind login load when first opened, so the first visit
// downloads less.
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: 'home', loadComponent: () => import('./home/home').then((m) => m.Home) },
      { path: 'sell', loadComponent: () => import('./sell/sell').then((m) => m.Sell) },
      { path: 'checkout/:cardId', loadComponent: () => import('./checkout/checkout').then((m) => m.Checkout) },
      { path: 'orders', loadComponent: () => import('./my-orders/my-orders').then((m) => m.MyOrders) },
      { path: 'orders/sales', loadComponent: () => import('./sales/sales').then((m) => m.Sales) },
      { path: 'profile', loadComponent: () => import('./profile/profile').then((m) => m.Profile) },
      { path: 'sellers/:username', loadComponent: () => import('./seller-profile/seller-profile').then((m) => m.SellerProfile) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
