import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { Game } from 'src/models/game';
import { LocalSingleplayerSaveService } from 'src/app/services/local-singleplayer-save.service';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentGameState } from 'src/app/states/currentGame-state';

import { GameMenuComponent } from './game-menu.component';

describe('GameMenuComponent', () => {
  let component: GameMenuComponent;
  let fixture: ComponentFixture<GameMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, NgxsModule.forRoot([CurrentGameState]), GameMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameMenuComponent);
    fixture.componentRef.setInput('isSingleplayer', true);
    fixture.componentRef.setInput('gameId', 'local-1');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts closed', () => {
    expect(component.isOpen()).toBeFalse();
  });

  it('toggle() opens the closed menu', () => {
    component.toggle();

    expect(component.isOpen()).toBeTrue();
  });

  it('toggle() closes the open menu again', () => {
    component.toggle();
    component.toggle();

    expect(component.isOpen()).toBeFalse();
  });

  it('emits leave when the user clicks "Verlassen"', () => {
    let emitted = false;
    component.leave.subscribe(() => (emitted = true));

    component.onLeave();

    expect(emitted).toBeTrue();
  });

  it('listSaves() lists the saves for "Spielstände laden"', () => {
    localStorage.clear();
    TestBed.inject(LocalSingleplayerSaveService).createSave({
      saveId: 'local-9',
      updatedAt: Date.now(),
      game: {} as Game,
      player: {},
    });

    expect(component.listSaves().map((save) => save.saveId)).toEqual(['local-9']);
    localStorage.clear();
  });

  it('onSave confirms once the save already exists (auto-save already wrote it)', () => {
    localStorage.clear();
    TestBed.inject(LocalSingleplayerSaveService).createSave({
      saveId: 'local-1',
      updatedAt: Date.now(),
      game: {} as Game,
      player: {},
    });

    component.onSave();

    expect(component.saveConfirmed()).toBeTrue();
    localStorage.clear();
  });

  it('resumeSave sets the current game and navigates to it', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.resumeSave('local-7');

    expect(TestBed.inject(Store).selectSnapshot(CurrentGameSelectors.currentGame)).toBe('local-7');
    expect(router.navigate).toHaveBeenCalledWith(['/local-game/local-7']);
  });
});
