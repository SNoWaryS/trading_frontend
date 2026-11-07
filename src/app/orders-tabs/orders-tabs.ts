import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

// Switches between the cards the user bought and the orders for cards they sell.
@Component({
  selector: 'app-orders-tabs',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="tabs" aria-label="Orders">
      <a
        class="tab"
        routerLink="/orders"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        ariaCurrentWhenActive="page"
        >Purchases</a
      >
      <a class="tab" routerLink="/orders/sales" routerLinkActive="active" ariaCurrentWhenActive="page">Sales</a>
    </nav>
  `,
  styles: `
    .tabs {
      display: flex;
      gap: 28px;
      margin-top: 20px;
    }

    .tab {
      padding-bottom: 6px;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-decoration: none;
      text-transform: uppercase;
    }

    .tab:hover {
      color: var(--forest);
    }

    .tab.active {
      border-bottom-color: var(--forest);
      color: var(--forest);
    }

    .tab:focus-visible {
      outline: 2px solid var(--forest);
      outline-offset: 4px;
    }
  `,
})
export class OrdersTabs {}
