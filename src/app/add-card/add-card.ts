import { afterNextRender, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardService } from '../cards/card.service';

const MAX_PICTURE_BYTES = 5 * 1024 * 1024;
const PICTURE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PRICE = 9_999_999_999; // Largest whole-baht value that fits DECIMAL(12,2).
const WHOLE_NUMBER = /^\d+$/;

@Component({
  selector: 'app-add-card',
  imports: [ReactiveFormsModule],
  templateUrl: './add-card.html',
  styleUrl: './add-card.css'
})
export class AddCard {
  readonly closed = output<void>();

  private readonly cards = inject(CardService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly cardTypes = ['Pokémon', 'Trainer', 'Energy'];
  protected readonly rarities = ['C', 'U', 'R', 'RR', 'AR', 'SR', 'SAR', 'UR'];
  protected readonly elements = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Colorless'];
  protected readonly stages = ['Basic', 'Stage 1', 'Stage 2'];

  protected readonly form = new FormGroup({
    cardName: new FormControl('', { nonNullable: true }),
    cardType: new FormControl('Pokémon', { nonNullable: true }),
    rarity: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    cardElement: new FormControl('', { nonNullable: true }),
    cardStage: new FormControl('', { nonNullable: true }),
    cardPrice: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(MAX_PRICE),
      Validators.pattern(WHOLE_NUMBER),
    ]),
    referencePrice: new FormControl<number | null>(null, [
      Validators.min(0),
      Validators.max(MAX_PRICE),
      Validators.pattern(WHOLE_NUMBER),
    ]),
    cardDescription: new FormControl('', { nonNullable: true }),
  });
  protected readonly picture = signal<string | null>(null);
  protected readonly errorMessage = signal('');

  private saved = false;

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected choosePicture(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!PICTURE_TYPES.includes(file.type)) {
      input.value = '';
      this.errorMessage.set('Please choose a JPG, PNG or WebP picture');
      return;
    }
    if (file.size > MAX_PICTURE_BYTES) {
      input.value = '';
      this.errorMessage.set('The picture must be 5 MB or smaller');
      return;
    }

    this.releasePicture();
    this.picture.set(URL.createObjectURL(file));
    this.errorMessage.set('');
  }

  protected submit(): void {
    const { controls } = this.form;
    const picture = this.picture();
    const cardName = controls.cardName.value.trim();

    if (!picture) {
      this.errorMessage.set('Please choose a picture of the card');
    } else if (!cardName || controls.rarity.invalid || controls.cardPrice.hasError('required')) {
      this.errorMessage.set('Please fill in all required fields');
    } else if (controls.cardPrice.invalid) {
      this.errorMessage.set('Price must be a whole number from 1 to 9,999,999,999');
    } else if (controls.referencePrice.invalid) {
      this.errorMessage.set('Reference price must be a whole number up to 9,999,999,999');
    } else {
      const values = this.form.getRawValue();
      this.cards
        .addListing({
          cardName,
          cardType: values.cardType,
          rarity: values.rarity,
          cardElement: values.cardElement || null,
          cardStage: values.cardStage || null,
          cardPrice: values.cardPrice!,
          referencePrice: values.referencePrice,
          cardPicture: picture,
          cardDescription: values.cardDescription.trim() || null,
        })
        .subscribe(() => {
          this.saved = true;
          this.close();
        });
    }
  }

  protected close(): void {
    this.dialog().nativeElement.close();
    this.finish();
  }

  protected finish(): void {
    if (!this.saved) {
      this.releasePicture();
    }
    this.closed.emit();
  }

  private releasePicture(): void {
    const picture = this.picture();
    if (picture) {
      URL.revokeObjectURL(picture);
      this.picture.set(null);
    }
  }
}
