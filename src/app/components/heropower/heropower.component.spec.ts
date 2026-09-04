import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store, NgxsModule } from '@ngxs/store';
import { CurrentUserHeroAction } from 'src/app/actions/currentUser-action';
import { CurrentUserState } from 'src/app/states/currentUser-state';
import { heropowerState } from 'src/app/states/heropower-state';

import { HeropowerComponent } from './heropower.component';

describe('HeropowerComponent', () => {
  let component: HeropowerComponent;
  let fixture: ComponentFixture<HeropowerComponent>;
  let store: Store;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [NgxsModule.forRoot([CurrentUserState, heropowerState]), HeropowerComponent],
})
    .compileComponents();

    fixture = TestBed.createComponent(HeropowerComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onActivateHeropower() (Issue #93 — vereinheitlichter Klick-Handler)', () => {
    it('delegiert für den Barbar an heroPowerBarbar()', () => {
      store.dispatch(new CurrentUserHeroAction('Barbar', 'Wutausbruch', 'Beschreibung'));
      fixture.detectChanges();
      spyOn(component, 'heroPowerBarbar');

      component.onActivateHeropower();

      expect(component.heroPowerBarbar).toHaveBeenCalled();
    });

    it('delegiert für die Walküre an heroPowerWalkuere()', () => {
      store.dispatch(new CurrentUserHeroAction('Walküre', 'Vergeltung', 'Beschreibung'));
      fixture.detectChanges();
      spyOn(component, 'heroPowerWalkuere');

      component.onActivateHeropower();

      expect(component.heroPowerWalkuere).toHaveBeenCalled();
    });

    it('tut nichts für einen unbekannten Heldennamen', () => {
      store.dispatch(new CurrentUserHeroAction('', '', ''));
      fixture.detectChanges();

      expect(() => component.onActivateHeropower()).not.toThrow();
    });
  });

  describe('Aktivierungs-Icon (Issue #93 — Pfad-Fix für GitHub Pages)', () => {
    it('rendert das Icon mit einem von der Route unabhängigen Pfad ("./assets/...")', () => {
      store.dispatch(new CurrentUserHeroAction('Barbar', 'Wutausbruch', 'Beschreibung'));
      component.sheetOpen.set(true);
      fixture.detectChanges();

      const img: HTMLImageElement = fixture.nativeElement.querySelector('.heropower-sheet img');

      expect(img.getAttribute('src')).toBe('./assets/img/icons/heldenfaehigkeit_icon.png');
    });

    it('rendert genau ein Icon (kein pro-Held dupliziertes @if mehr)', () => {
      store.dispatch(new CurrentUserHeroAction('Barbar', 'Wutausbruch', 'Beschreibung'));
      component.sheetOpen.set(true);
      fixture.detectChanges();

      const imgs = fixture.nativeElement.querySelectorAll('.heropower-sheet img');

      expect(imgs.length).toBe(1);
    });
  });
});
