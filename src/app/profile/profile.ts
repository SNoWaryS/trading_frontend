import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CardService } from '../cards/card.service';
import { DeleteAccount } from '../delete-account/delete-account';
import { EditProfile } from '../edit-profile/edit-profile';
import { OrderService } from '../orders/order.service';
import { isReviewed } from '../reviews/review';
import { ReviewService } from '../reviews/review.service';
import { SiteHeader } from '../site-header/site-header';
import { UserService } from '../users/user.service';

@Component({
  selector: 'app-profile',
  imports: [DeleteAccount, EditProfile, RouterLink, SiteHeader],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  private readonly users = inject(UserService);
  private readonly router = inject(Router);
  private readonly orderService = inject(OrderService);

  protected readonly user = toSignal(this.users.getCurrentUser());
  private readonly listings = toSignal(inject(CardService).getMyListings(), { initialValue: [] });
  private readonly myOrders = toSignal(this.orderService.getMyOrders(), { initialValue: [] });
  private readonly allOrders = toSignal(this.orderService.getOrders(), { initialValue: [] });
  private readonly reviews = toSignal(inject(ReviewService).getReviews(), { initialValue: [] });

  protected readonly editing = signal(false);
  protected readonly deleting = signal(false);

  protected readonly initials = computed(() => {
    const user = this.user();
    return user ? `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase() : '';
  });

  protected readonly cardsForSale = computed(() => this.listings().length);
  protected readonly orderCount = computed(() => this.myOrders().length);
  protected readonly reviewCount = computed(() => {
    const myOrderIds = new Set(this.myOrders().map((order) => order.orderId));
    return this.reviews().filter((review) => myOrderIds.has(review.orderId) && isReviewed(review)).length;
  });

  // Reviews other buyers wrote on orders for this user's cards, newest first.
  protected readonly receivedReviews = computed(() => {
    const myCards = new Map(this.listings().map((card) => [card.cardId, card]));
    return this.reviews()
      .filter(isReviewed)
      .flatMap((review) => {
        const order = this.allOrders().find((item) => item.orderId === review.orderId);
        const card = order ? myCards.get(order.cardId) : undefined;
        return order && card ? [{ review, card }] : [];
      })
      .reverse();
  });

  protected logOut(): void {
    this.router.navigate(['/login']);
  }

  protected deleteAccount(): void {
    this.users.deleteAccount().subscribe(() => {
      this.deleting.set(false);
      this.router.navigate(['/login'], { state: { accountDeleted: true } });
    });
  }
}
