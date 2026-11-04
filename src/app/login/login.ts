import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthShell } from '../auth-shell/auth-shell';
import { PrivacyPolicy } from '../privacy-policy/privacy-policy';

const API_URL = 'http://localhost:5041';

interface LoginResponse {
  userId: number;
  username: string;
  name: string;
  surname: string;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, AuthShell, PrivacyPolicy],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly justRegistered = signal(
    this.router.currentNavigation()?.extras.state?.['registered'] === true
  );
  protected readonly policyOpen = signal(false);

  protected acceptPolicy(): void {
    this.router.navigate(['/register']);
  }

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.errorMessage.set('');

    if (this.form.invalid) {
      this.errorMessage.set('Please enter your username and password');
      return;
    }

    this.submitting.set(true);
    this.http.post<LoginResponse>(`${API_URL}/api/auth/login`, this.form.getRawValue()).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        this.form.controls.password.reset();
        this.errorMessage.set(
          error.status === 401
            ? 'Incorrect username or password'
            : 'Cannot reach the server. Please try again.'
        );
      },
    });
  }
}
