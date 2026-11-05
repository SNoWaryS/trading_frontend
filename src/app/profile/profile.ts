import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CardService } from '../cards/card.service';
import { OrderService } from '../orders/order.service';
import { isReviewed } from '../reviews/review';
import { ReviewService } from '../reviews/review.service';
import { SiteHeader } from '../site-header/site-header';
import { UserService } from '../users/user.service';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, SiteHeader],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  protected readonly user = toSignal(inject(UserService).getCurrentUser());
  private readonly listings = toSignal(inject(CardService).getMyListings(), { initialValue: [] });
  private readonly orders = toSignal(inject(OrderService).getMyOrders(), { initialValue: [] });
  private readonly reviews = toSignal(inject(ReviewService).getReviews(), { initialValue: [] });

  protected readonly initials = computed(() => {
    const user = this.user();
    return user ? `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase() : '';
  });

  protected readonly cardsForSale = computed(() => this.listings().length);
  protected readonly orderCount = computed(() => this.orders().length);
  protected readonly reviewCount = computed(() => {
    const myOrderIds = new Set(this.orders().map((order) => order.orderId));
    return this.reviews().filter((review) => myOrderIds.has(review.orderId) && isReviewed(review)).length;
  });
}
