import { RenderMode, ServerRoute } from '@angular/ssr';

// Pages behind the login are rendered in the browser: the session cookie is not available
// when pages are prerendered at build time, so they would only ever prerender a redirect to login.
const loggedInPages = ['home', 'sell', 'checkout/:cardId', 'orders', 'orders/sales', 'profile', 'sellers/:username'];

export const serverRoutes: ServerRoute[] = [
  ...loggedInPages.map((path): ServerRoute => ({ path, renderMode: RenderMode.Client })),
  {
    // The login and register pages.
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
