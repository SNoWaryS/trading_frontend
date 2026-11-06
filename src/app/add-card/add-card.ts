import { CurrencyPipe } from '@angular/common';
import { afterNextRender, Component, computed, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogCard, matchesCatalogSearch } from '../cards/card-catalog';
import { cardMeta } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { CatalogService } from '../cards/catalog.service';
import { PICTURE_ACCEPT, pictureFileError } from '../shared/picture-file';

const MAX_PRICE = 9_999_999_999; // Largest whole-baht value that fits DECIMAL(12,2).
const WHOLE_NUMBER = /^\d+$/;

@Component({
  selector: 'app-add-card',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './add-card.html',
  styleUrl: './add-card.css'
})
export class AddCard {
  readonly closed = output<void>();

  private readonly cards = inject(CardService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly catalog = toSignal(inject(CatalogService).getCatalog(), { initialValue: [] });

  protected readonly pictureAccept = PICTURE_ACCEPT;
  protected readonly cardMeta = cardMeta;

  protected readonly search = signal('');
  protected readonly results = computed(() =>
    this.catalog().filter((card) => matchesCatalogSearch(card, this.search()))
  );
  protected readonly selected = signal<CatalogCard | null>(null);

  protected readonly form = new FormGroup({
    cardPrice: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(MAX_PRICE),
      Validators.pattern(WHOLE_NUMBER),
    ]),
    cardDescription: new FormControl('', { nonNullable: true }),
  });
  protected readonly photo = signal<string | null>(null);
  protected readonly errorMessage = signal('');

  private saved = false;

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected choose(card: CatalogCard): void {
    this.selected.set(card);
    this.errorMessage.set('');
  }

  protected changeCard(): void {
    this.selected.set(null);
  }

  protected choosePhoto(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const error = pictureFileError(file);
    if (error) {
      input.value = '';
      this.errorMessage.set(error);
      return;
    }

    this.releasePhoto();
    this.photo.set(URL.createObjectURL(file));
    this.errorMessage.set('');
  }

  protected submit(): void {
    const card = this.selected();
    const { cardPrice, cardDescription } = this.form.controls;

    if (!card) {
      this.errorMessage.set('Please choose a card from the catalog');
    } else if (cardPrice.hasError('required')) {
      this.errorMessage.set('Please enter your price');
    } else if (cardPrice.invalid) {
      this.errorMessage.set('Price must be a whole number from 1 to 9,999,999,999');
    } else {
      this.cards
        .addListing({
          catalogId: card.catalogId,
          cardPrice: cardPrice.value!,
          cardPicture: this.photo(),
          cardDescription: cardDescription.value.trim() || null,
        })
        .subscribe({
          next: () => {
            this.saved = true;
            this.close();
          },
          error: (error: Error) => this.errorMessage.set(error.message),
        });
    }
  }

  protected close(): void {
    this.dialog().nativeElement.close();
    this.finish();
  }

  protected finish(): void {
    if (!this.saved) {
      this.releasePhoto();
    }
    this.closed.emit();
  }

  private releasePhoto(): void {
    const photo = this.photo();
    if (photo) {
      URL.revokeObjectURL(photo);
      this.photo.set(null);
    }
  }
}
