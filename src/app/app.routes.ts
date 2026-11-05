import { Routes } from '@angular/router';
import { Checkout } from './checkout/checkout';
import { Home } from './home/home';
import { Login } from './login/login';
import { Register } from './register/register';
import { Sell } from './sell/sell';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home },
  { path: 'sell', component: Sell },
  { path: 'checkout/:cardId', component: Checkout },
  { path: '**', redirectTo: 'login' },
];
