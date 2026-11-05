import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { CardDetail } from '../card-detail/card-detail';
import { CardListing, cardMeta } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { ReviewService } from '../reviews/review.service';
import { SiteHeader } from '../site-header/site-header';
import { UserService } from '../users/user.service';

@Component({
  selector: 'app-seller-profile',
  imports: [CardDetail, CurrencyPipe, RouterLink, SiteHeader],
  templateUrl: './seller-profile.html',
  styleUrl: './seller-profile.css'
})
export class SellerProfile {
  private readonly cards = inject(CardService);
  private readonly router = inject(Router);

  private readonly username$ = inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('username') ?? ''));
  private readonly users = inject(UserService);
  private readonly reviewService = inject(ReviewService);

  // undefined while loading or when no seller has this username.
  protected readonly seller = toSignal(this.username$.pipe(switchMap((username) => this.users.getPublicProfile(username))));
  private readonly username = toSignal(this.username$, { initialValue: '' });
  private readonly allListings = toSignal(this.cards.getListings(), { initialValue: [] });
  protected readonly listings = computed(() =>
    this.allListings().filter((card) => card.sellerName === this.username())
  );
  protected readonly reviews = toSignal(
    this.username$.pipe(switchMap((username) => this.reviewService.getReviewsForSeller(username))),
    { initialValue: [] }
  );

  protected readonly selectedCard = signal<CardListing | null>(null);
  protected readonly cardMeta = cardMeta;

  protected readonly initials = computed(() => {
    const seller = this.seller();
    return seller ? `${seller.name.charAt(0)}${seller.surname.charAt(0)}`.toUpperCase() : '';
  });

  protected isOwn(card: CardListing): boolean {
    return this.cards.isOwnListing(card);
  }

  protected buy(card: CardListing): void {
    this.router.navigate(['/checkout', card.cardId]);
  }
}
