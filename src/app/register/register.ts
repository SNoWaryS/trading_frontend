import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthShell } from '../auth-shell/auth-shell';

const API_URL = 'http://localhost:5041';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  templateUrl: './register.html',
  styleUrls: ['../login/login.css', './register.css']
})
export class Register {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    surname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phoneNumber: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
  });
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.errorMessage.set('');
    const { confirmPassword, ...account } = this.form.getRawValue();

    if (this.form.invalid) {
      this.errorMessage.set('Please fill in all required fields');
      return;
    }
    if (account.password.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters');
      return;
    }
    if (account.password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    this.submitting.set(true);
    this.http.post(`${API_URL}/api/auth/register`, account).subscribe({
      next: () => {
        this.router.navigate(['/login'], { state: { registered: true } });
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(
          error.status === 400 || error.status === 409
            ? error.error.message
            : 'Cannot reach the server. Please try again.'
        );
      },
    });
  }
}
