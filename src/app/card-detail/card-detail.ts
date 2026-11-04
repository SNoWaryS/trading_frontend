import { CurrencyPipe } from '@angular/common';
import { afterNextRender, Component, ElementRef, input, output, viewChild } from '@angular/core';
import { CardListing } from '../cards/card-listing';

@Component({
  selector: 'app-card-detail',
  imports: [CurrencyPipe],
  templateUrl: './card-detail.html',
  styleUrl: './card-detail.css'
})
export class CardDetail {
  readonly card = input.required<CardListing>();
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected close(): void {
    this.dialog().nativeElement.close();
    this.closed.emit();
  }

  // A click on the dialog element itself, not its content, is a click on the backdrop.
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
