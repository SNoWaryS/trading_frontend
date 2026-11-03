import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Register } from './register';

const URL = 'http://localhost:5041/api/auth/register';

describe('Register', () => {
  let fixture: ComponentFixture<Register>;
  let http: HttpTestingController;

  const element = () => fixture.nativeElement as HTMLElement;

  async function submit(values: Record<string, string>) {
    for (const [name, value] of Object.entries(values)) {
      const input = element().querySelector<HTMLInputElement>(`[formControlName=${name}]`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    element().querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  const validAccount = {
    name: 'Alice',
    surname: 'Smith',
    username: 'alice',
    email: 'alice@test.local',
    password: 'password123',
    confirmPassword: 'password123',
    address: '1 Test Road',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('rejects passwords that do not match without calling the API', async () => {
    await submit({ ...validAccount, confirmPassword: 'different123' });

    http.expectNone(URL);
    expect(element().querySelector('[role=alert]')?.textContent).toContain('do not match');
  });

  it('sends the account without the confirmation and goes to the login page', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    await submit(validAccount);

    const request = http.expectOne(URL);
    expect(request.request.body).toEqual({
      name: 'Alice',
      surname: 'Smith',
      username: 'alice',
      email: 'alice@test.local',
      password: 'password123',
      phoneNumber: '',
      address: '1 Test Road',
    });

    request.flush({ userId: 1, username: 'alice' }, { status: 201, statusText: 'Created' });

    expect(navigate).toHaveBeenCalledWith(['/login'], { state: { registered: true } });
  });

  it('shows the server message when the username is taken', async () => {
    await submit(validAccount);

    http
      .expectOne(URL)
      .flush({ message: 'This username is already taken' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();

    expect(element().querySelector('[role=alert]')?.textContent).toContain('already taken');
  });
});
