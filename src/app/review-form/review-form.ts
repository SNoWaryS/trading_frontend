import { afterNextRender, Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardListing } from '../cards/card-listing';
import { Order } from '../orders/order';
import { ReviewService } from '../reviews/review.service';

@Component({
  selector: 'app-review-form',
  imports: [ReactiveFormsModule],
  templateUrl: './review-form.html',
  styleUrl: './review-form.css'
})
export class ReviewForm {
  readonly order = input.required<Order>();
  readonly card = input.required<CardListing>();
  readonly closed = output<void>();

  private readonly reviews = inject(ReviewService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly form = new FormGroup({
    comment: new FormControl('', { nonNullable: true }),
  });
  protected readonly errorMessage = signal('');

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.errorMessage.set(''));
  }

  protected submit(): void {
    const comment = this.form.controls.comment.value.trim();
    if (!comment) {
      this.errorMessage.set('Please write your review');
      return;
    }

    this.reviews.addReview(this.order(), comment).subscribe({
      next: () => this.close(),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }

  protected close(): void {
    this.dialog().nativeElement.close();
    this.closed.emit();
  }
}
