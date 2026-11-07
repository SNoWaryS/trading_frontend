import { afterNextRender, Component, ElementRef, inject, input, OnInit, output, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserProfile } from '../users/user-profile';
import { UserService } from '../users/user.service';

// Same limits as the USERS table and the register API.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-edit-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfile implements OnInit {
  readonly user = input.required<UserProfile>();
  readonly closed = output<void>();

  private readonly users = inject(UserService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    surname: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    phoneNumber: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
  });
  protected readonly errorMessage = signal('');
  protected readonly saving = signal(false);

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  ngOnInit(): void {
    const user = this.user();
    this.form.setValue({
      name: user.name,
      surname: user.surname,
      email: user.email,
      phoneNumber: user.phoneNumber ?? '',
      address: user.address ?? '',
    });
  }

  protected submit(): void {
    const values = this.form.getRawValue();
    const name = values.name.trim();
    const surname = values.surname.trim();
    const email = values.email.trim();
    const phoneNumber = values.phoneNumber.trim();
    const address = values.address.trim();

    const error =
      !name || !surname || !email ? 'Please fill in your name, surname and email'
      : name.length > 100 || surname.length > 100 ? 'Name and surname must be 100 characters or fewer'
      : email.length > 255 || !EMAIL.test(email) ? 'Please enter a valid email'
      : phoneNumber.length > 20 ? 'Phone number must be 20 characters or fewer'
      : address.length > 500 ? 'Address must be 500 characters or fewer'
      : null;
    if (error) {
      this.errorMessage.set(error);
      return;
    }

    this.errorMessage.set('');
    this.saving.set(true);
    this.users
      .updateProfile({ name, surname, email, phoneNumber: phoneNumber || null, address: address || null })
      .subscribe({
        next: () => this.close(),
        error: (error: Error) => {
          this.saving.set(false);
          this.errorMessage.set(error.message);
        },
      });
  }

  protected close(): void {
    this.dialog().nativeElement.close();
    this.closed.emit();
  }
}
