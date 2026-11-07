import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CardService } from '../cards/card.service';
import { Sell } from './sell';
import { signIn } from '../testing/session';
import { provideSampleCards } from '../testing/sample-cards';

describe('Sell', () => {
  async function render(providers: object[] = []) {
    await TestBed.configureTestingModule({
      imports: [Sell],
      providers: [...provideSampleCards(), provideRouter([]), ...providers],
    }).compileComponents();
    signIn();

    const fixture = TestBed.createComponent(Sell);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('marks sold cards and no longer offers to edit or remove them', async () => {
    const element = await render();
    TestBed.inject(CardService).markSold(3);
    await TestBed.inject(ApplicationRef).whenStable();

    const tile = Array.from(element.querySelectorAll('.listing')).find(
      (item) => item.querySelector('.name')?.textContent === 'Sample Card 03'
    )!;
    expect(tile.querySelector('.sold')?.textContent).toContain('Sold');
    expect(tile.querySelector('.card-action')).toBeNull();
    expect(element.querySelector('.subtitle')?.textContent).toContain('2 for sale · 1 sold');
  });

  it('lists only the cards this user is selling', async () => {
    const element = await render();
    const names = Array.from(element.querySelectorAll('.name')).map((name) => name.textContent);

    expect(names).toEqual(['Sample Card 01', 'Sample Card 03', 'Sample Card 06']);
    expect(element.querySelector('.subtitle')?.textContent).toContain('3 for sale · 0 sold');
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

  describe('editing and removing', () => {
    let element: HTMLElement;
    const names = () => Array.from(element.querySelectorAll('.name')).map((name) => name.textContent);
    const stable = () => TestBed.inject(ApplicationRef).whenStable();

    function button(cardName: string, label: string): HTMLButtonElement {
      const tile = Array.from(element.querySelectorAll('.listing')).find(
        (item) => item.querySelector('.name')?.textContent === cardName
      )!;
      return Array.from(tile.querySelectorAll<HTMLButtonElement>('button')).find(
        (item) => item.textContent?.trim() === label
      )!;
    }

    function setField(selector: string, value: string) {
      const field = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
      field.value = value;
      field.dispatchEvent(new Event('input'));
    }

    beforeEach(async () => {
      element = await render();
    });

    it('changes the price and description of a card', async () => {
      button('Sample Card 03', 'Edit').click();
      await stable();

      expect(element.querySelector<HTMLInputElement>('#price-3')!.value).toBe('320');
      setField('#price-3', '450');
      setField('#description-3', '  Now in a top loader  ');
      element.querySelector('form.edit')!.dispatchEvent(new Event('submit'));
      await stable();

      expect(element.querySelector('form.edit')).toBeNull();
      const tile = button('Sample Card 03', 'Edit').closest('.listing')!;
      expect(tile.querySelector('.price')?.textContent).toContain('450');
    });

    it('rejects a price that is not a whole number', async () => {
      button('Sample Card 03', 'Edit').click();
      await stable();
      setField('#price-3', '12.5');
      element.querySelector('form.edit')!.dispatchEvent(new Event('submit'));
      await stable();

      expect(element.querySelector('[role=alert]')?.textContent).toContain('Price must be');
      expect(element.querySelector('form.edit')).not.toBeNull();
    });

    it('removes a card after the seller confirms', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      button('Sample Card 03', 'Remove').click();
      await stable();

      expect(window.confirm).toHaveBeenCalledWith('Remove Sample Card 03 from sale?');
      expect(names()).toEqual(['Sample Card 01', 'Sample Card 06']);
    });

    it('keeps the card when the seller does not confirm', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      button('Sample Card 03', 'Remove').click();
      await stable();

      expect(names()).toEqual(['Sample Card 01', 'Sample Card 03', 'Sample Card 06']);
    });
  });

  it('shows a message when the user has no cards for sale', async () => {
    const element = await render([{ provide: CardService, useValue: { getMyListings: () => of([]) } }]);

    expect(element.querySelector('.grid')).toBeNull();
    expect(element.querySelector('.empty')?.textContent).toContain('no cards for sale');
    expect(element.querySelector('.add')).not.toBeNull();
  });
});
