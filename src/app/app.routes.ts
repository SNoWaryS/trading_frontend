import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guards';
import { Checkout } from './checkout/checkout';
import { Home } from './home/home';
import { Login } from './login/login';
import { MyOrders } from './my-orders/my-orders';
import { Profile } from './profile/profile';
import { Register } from './register/register';
import { SellerProfile } from './seller-profile/seller-profile';
import { Sales } from './sales/sales';
import { Sell } from './sell/sell';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      { path: 'home', component: Home },
      { path: 'sell', component: Sell },
      { path: 'checkout/:cardId', component: Checkout },
      { path: 'orders', component: MyOrders },
      { path: 'orders/sales', component: Sales },
      { path: 'profile', component: Profile },
      { path: 'sellers/:username', component: SellerProfile },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
