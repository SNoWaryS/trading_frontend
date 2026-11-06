import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CardService } from '../cards/card.service';
import { Sell } from './sell';
import { signIn } from '../testing/session';

describe('Sell', () => {
  async function render(providers: object[] = []) {
    await TestBed.configureTestingModule({
      imports: [Sell],
      providers: [provideRouter([]), ...providers],
    }).compileComponents();
    signIn();

    const fixture = TestBed.createComponent(Sell);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('lists only the cards this user is selling', async () => {
    const element = await render();
    const names = Array.from(element.querySelectorAll('.name')).map((name) => name.textContent);

    expect(names).toEqual(['Sample Card 01', 'Sample Card 03', 'Sample Card 06']);
    expect(element.querySelector('.subtitle')?.textContent).toContain('3 cards listed');
  });

  it('has a button for adding a card', async () => {
    const element = await render();

    expect(element.querySelector('.add')?.textContent).toContain('Add card');
  });

  it('opens the add card form from the button', async () => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    const element = await render();

    expect(element.querySelector('app-add-card')).toBeNull();

    element.querySelector<HTMLButtonElement>('.add')!.click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(element.querySelector('app-add-card')).not.toBeNull();
  });

  it('shows a message when the user has no cards for sale', async () => {
    const element = await render([{ provide: CardService, useValue: { getMyListings: () => of([]) } }]);

    expect(element.querySelector('.grid')).toBeNull();
    expect(element.querySelector('.empty')?.textContent).toContain('no cards for sale');
    expect(element.querySelector('.add')).not.toBeNull();
  });
});
