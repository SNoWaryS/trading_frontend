import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthShell } from '../auth-shell/auth-shell';

const API_URL = 'http://localhost:5041';

interface LoginResponse {
  userId: number;
  username: string;
  name: string;
  surname: string;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly http = inject(HttpClient);

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly loggedInAs = signal('');
  protected readonly justRegistered = signal(
    inject(Router).currentNavigation()?.extras.state?.['registered'] === true
  );

  protected submit(): void {
    if (this.submitting()) {
      return;
    }

    this.errorMessage.set('');
    this.loggedInAs.set('');

    if (this.form.invalid) {
      this.errorMessage.set('Please enter your username and password');
      return;
    }

    this.submitting.set(true);
    this.http.post<LoginResponse>(`${API_URL}/api/auth/login`, this.form.getRawValue()).subscribe({
      next: (user) => {
        this.submitting.set(false);
        this.form.reset();
        this.loggedInAs.set(user.username);
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
