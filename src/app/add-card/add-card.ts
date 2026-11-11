import { CurrencyPipe } from '@angular/common';
import { afterNextRender, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { CatalogCard } from '../cards/card-catalog';
import { cardMeta } from '../cards/card-listing';
import { CardService } from '../cards/card.service';
import { CATALOG_SEARCH_LIMIT, CatalogService } from '../cards/catalog.service';
import { PICTURE_ACCEPT, pictureFileError } from '../shared/picture-file';

const MAX_PRICE = 9_999_999_999;
const WHOLE_NUMBER = /^\d+$/;
export const SEARCH_DELAY_MS = 250;

interface CatalogSearch {
  term: string;
  cards: CatalogCard[];
  failed: boolean;
}

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
  private readonly catalog = inject(CatalogService);

  protected readonly pictureAccept = PICTURE_ACCEPT;
  protected readonly cardMeta = cardMeta;
  protected readonly searchLimit = CATALOG_SEARCH_LIMIT;

  protected readonly search = signal('');
  protected readonly found = toSignal(
    toObservable(this.search).pipe(
      map((term) => term.trim()),
      debounceTime(SEARCH_DELAY_MS),
      distinctUntilChanged(),
      switchMap((term) =>
        this.catalog.search(term).pipe(
          map((cards): CatalogSearch => ({ term, cards, failed: false })),
          catchError(() => of<CatalogSearch>({ term, cards: [], failed: true }))
        )
      ),
      startWith(null)
    ),
    { initialValue: null }
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
  protected readonly saving = signal(false);

  private photoFile: File | null = null;

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
    this.photoFile = file;
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
    } else if (!this.saving()) {
      this.saving.set(true);
      this.errorMessage.set('');
      this.cards
        .addListing({
          catalogId: card.catalogId,
          cardPrice: Number(cardPrice.value),
          cardDescription: cardDescription.value.trim() || null,
          photo: this.photoFile,
        })
        .subscribe({
          next: () => this.close(),
          error: (error: Error) => {
            this.saving.set(false);
            this.errorMessage.set(error.message);
          },
        });
    }
  }

  protected close(): void {
    this.dialog().nativeElement.close();
    this.finish();
  }

  protected finish(): void {
    this.releasePhoto();
    this.closed.emit();
  }

  private releasePhoto(): void {
    const photo = this.photo();
    if (photo) {
      URL.revokeObjectURL(photo);
      this.photo.set(null);
    }
    this.photoFile = null;
  }
}
