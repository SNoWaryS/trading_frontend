import { HttpClient } from '@angular/common/http';
import { afterNextRender, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

const API_URL = 'http://localhost:5041';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly http = inject(HttpClient);

  protected readonly title = signal('trading');
  protected readonly connectionStatus = signal('Checking connection...');

  constructor() {
    // Browser only: routes are prerendered, so a call during the build would bake in a stale status.
    afterNextRender(() => {
      this.http.get<{ status: string; database: string }>(`${API_URL}/api/health`).subscribe({
        next: (health) => this.connectionStatus.set(`Connected to database: ${health.database}`),
        error: () => this.connectionStatus.set('Connection failed: check the back end and database'),
      });
    });
  }
}
