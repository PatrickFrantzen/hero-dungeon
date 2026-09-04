import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Auth } from '@angular/fire/auth';
import { NgxsModule, Store } from '@ngxs/store';
import { of } from 'rxjs';
import { CurrentUserState } from 'src/app/states/currentUser-state';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { LocalSingleplayerSaveService } from 'src/app/services/local-singleplayer-save.service';
import { Game } from 'src/models/game';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { StartscreenComponent } from './startscreen.component';

describe('StartscreenComponent', () => {
  let component: StartscreenComponent;
  let fixture: ComponentFixture<StartscreenComponent>;

  beforeEach(async () => {
    ensureFirebaseTestAppInitialized();

    await TestBed.configureTestingModule({
    imports: [RouterTestingModule, MatDialogModule, NgxsModule.forRoot([CurrentUserState, CurrentGameState]), StartscreenComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        // no-op statt {}: mehrere Tests hier erzeugen eine zweite Fixture, deren ngOnInit()
        // erneut CurrentUserService.getCurrentUser() -> onAuthStateChanged(this.auth, ...)
        // aufruft - ein leeres {} wirft dort "onAuthStateChanged is not a function".
        { provide: Auth, useValue: { onAuthStateChanged: () => () => {} } },
        ...firestoreTestProviders(),
    ],
})
    .compileComponents();

    ensureAngularFireSchedulersInitialized();
    fixture = TestBed.createComponent(StartscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates a newly created singleplayer game to local-game/:id, not game/:id', async () => {
    spyOn(component.dialog, 'open').and.returnValue({
      afterClosed: () => of({ data: { numberOfPlayer: 1, difficulty: 'easy', gameId: 'local-42' } }),
    } as MatDialogRef<unknown>);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.newSingleplayerGame();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/local-game/local-42']);
  });

  it('lists local saves for "Meine Spielstände"', () => {
    localStorage.clear();
    TestBed.inject(LocalSingleplayerSaveService).createSave({
      saveId: 'local-7',
      updatedAt: 1234,
      game: { gameId: 'local-7', numberOfPlayers: 1 } as unknown as Game,
      player: {},
    });

    const localFixture = TestBed.createComponent(StartscreenComponent);
    localFixture.detectChanges();

    expect(localFixture.componentInstance.localSaves().map((save) => save.saveId)).toEqual(['local-7']);
    localStorage.clear();
  });

  it('resuming a local save sets it as the current game and navigates to it', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.resumeLocalSave('local-7');

    expect(TestBed.inject(Store).selectSnapshot(CurrentGameSelectors.currentGame)).toBe('local-7');
    expect(router.navigate).toHaveBeenCalledWith(['/local-game/local-7']);
  });
});
