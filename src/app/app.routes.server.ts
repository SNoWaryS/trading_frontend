import { RenderMode, ServerRoute } from '@angular/ssr';

const loggedInPages = ['home', 'sell', 'checkout/:cardId', 'orders', 'orders/sales', 'profile', 'sellers/:username'];

export const serverRoutes: ServerRoute[] = [
  ...loggedInPages.map((path): ServerRoute => ({ path, renderMode: RenderMode.Client })),
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
