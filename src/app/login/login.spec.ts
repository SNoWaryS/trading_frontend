import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;

  async function submit(username: string, password: string) {
    const [usernameInput, passwordInput] = Array.from(element().querySelectorAll('input'));
    usernameInput.value = username;
    usernameInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('asks for both fields without calling the API', async () => {
    await submit('', '');

    http.expectNone('http://localhost:5041/api/auth/login');
    expect(element().querySelector('[role=alert]')?.textContent).toContain('Please enter');
  });

  it('sends the credentials and shows the logged-in user', async () => {
    await submit('alice', 'secret');

    const request = http.expectOne('http://localhost:5041/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'alice', password: 'secret' });

    request.flush({ userId: 1, username: 'alice', name: 'A', surname: 'B' });
    await fixture.whenStable();

    expect(element().querySelector('[role=status]')?.textContent).toContain('Logged in as alice');
  });

  it('shows an error and clears the password when the login is rejected', async () => {
    await submit('alice', 'wrong');

    http
      .expectOne('http://localhost:5041/api/auth/login')
      .flush({ message: 'Incorrect username or password' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(element().querySelector('[role=alert]')?.textContent).toContain('Incorrect username or password');
    expect(element().querySelectorAll('input')[1].value).toBe('');
  });
});
