import { afterNextRender, Component, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { UserService } from '../users/user.service';

// Asks for the user's password, then deletes their account. Emits `deleted` once the API has done it.
@Component({
  selector: 'app-delete-account',
  templateUrl: './delete-account.html',
  styleUrl: './delete-account.css'
})
export class DeleteAccount {
  readonly deleted = output<void>();
  readonly closed = output<void>();

  private readonly users = inject(UserService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly password = signal('');
  protected readonly errorMessage = signal('');
  protected readonly deleting = signal(false);

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected confirm(): void {
    if (!this.password()) {
      this.errorMessage.set('Please enter your password to confirm');
      return;
    }

    this.errorMessage.set('');
    this.deleting.set(true);
    this.users.deleteAccount(this.password()).subscribe({
      next: () => this.deleted.emit(),
      error: (error: Error) => {
        this.deleting.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }

  protected close(): void {
    this.dialog().nativeElement.close();
    this.closed.emit();
  }
}
