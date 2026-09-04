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
import { AuthFormService } from 'src/app/services/auth-form.service';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { UserRepositoryService } from 'src/app/services/user-repository.service';
import { CurrentUserAction } from 'src/app/actions/currentUser-action';
import { DialogConfirmComponent } from '../dialog-confirm/dialog-confirm.component';
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

  it('newSingleplayerGame() does not sign in anonymously (Singleplayer needs no auth)', async () => {
    const authForm = TestBed.inject(AuthFormService);
    const ensureAnonymousSession = spyOn(authForm, 'ensureAnonymousSession').and.resolveTo();
    spyOn(component.dialog, 'open').and.returnValue({
      afterClosed: () => of({ data: { numberOfPlayer: 1, difficulty: 'easy', gameId: 'local-42' } }),
    } as MatDialogRef<unknown>);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.newSingleplayerGame();
    await fixture.whenStable();

    expect(ensureAnonymousSession).not.toHaveBeenCalled();
  });

  it('newGame() signs in anonymously before the settings dialog opens', async () => {
    const authForm = TestBed.inject(AuthFormService);
    const ensureAnonymousSession = spyOn(authForm, 'ensureAnonymousSession').and.resolveTo();
    const dialogOpen = spyOn(component.dialog, 'open').and.returnValue({
      afterClosed: () => of(undefined),
    } as MatDialogRef<unknown>);

    component.newGame();
    await fixture.whenStable();

    expect(ensureAnonymousSession).toHaveBeenCalled();
    expect(dialogOpen).toHaveBeenCalled();
  });

  it('joinGame() signs in anonymously before reading the game from Firestore', async () => {
    const authForm = TestBed.inject(AuthFormService);
    const ensureAnonymousSession = spyOn(authForm, 'ensureAnonymousSession').and.resolveTo();
    const gameRepo = TestBed.inject(GameRepositoryService);
    const getGame = spyOn(gameRepo, 'getGame').and.resolveTo(undefined);
    component.joinGameId = 'game-42';

    await component.joinGame();

    expect(ensureAnonymousSession).toHaveBeenCalled();
    expect(getGame).toHaveBeenCalledWith('game-42');
  });

  describe('"Meine Spiele" (Issue #78)', () => {
    it('createGame() (multiplayer) records the joined game for the current account', async () => {
      const store = TestBed.inject(Store);
      store.dispatch(new CurrentUserAction('user-1', 'Alice'));
      spyOn(TestBed.inject(AuthFormService), 'ensureAnonymousSession').and.resolveTo();
      spyOn(component.dialog, 'open').and.returnValue({
        afterClosed: () => of({ data: { numberOfPlayer: 2, difficulty: 'easy', gameId: 'game-99' } }),
      } as MatDialogRef<unknown>);
      spyOn(TestBed.inject(GameRepositoryService), 'createGame').and.resolveTo();
      const addJoinedGame = spyOn(TestBed.inject(UserRepositoryService), 'addJoinedGame').and.resolveTo();
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      component.newGame();
      await fixture.whenStable();

      expect(addJoinedGame).toHaveBeenCalledWith('user-1', 'game-99');
    });

    it('createGame() (local singleplayer) does NOT record a joined game - Singleplayer has no account concept', async () => {
      spyOn(component.dialog, 'open').and.returnValue({
        afterClosed: () => of({ data: { numberOfPlayer: 1, difficulty: 'easy', gameId: 'local-42' } }),
      } as MatDialogRef<unknown>);
      const addJoinedGame = spyOn(TestBed.inject(UserRepositoryService), 'addJoinedGame').and.resolveTo();
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      component.newSingleplayerGame();
      await fixture.whenStable();

      expect(addJoinedGame).not.toHaveBeenCalled();
    });

    it('joinGame() records the joined game for the current account after a successful join', async () => {
      const store = TestBed.inject(Store);
      store.dispatch(new CurrentUserAction('user-1', 'Alice'));
      spyOn(TestBed.inject(AuthFormService), 'ensureAnonymousSession').and.resolveTo();
      spyOn(TestBed.inject(GameRepositoryService), 'getGame').and.resolveTo({ currentEnemy: {}, Mob: [] });
      const addJoinedGame = spyOn(TestBed.inject(UserRepositoryService), 'addJoinedGame').and.resolveTo();
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      component.joinGameId = 'game-42';

      await component.joinGame();
      await fixture.whenStable();

      expect(addJoinedGame).toHaveBeenCalledWith('user-1', 'game-42');
    });

    it('a "Meine Spiele" entry can be joined directly by gameId, without the manual input field', async () => {
      const store = TestBed.inject(Store);
      store.dispatch(new CurrentUserAction('user-1', 'Alice'));
      spyOn(TestBed.inject(AuthFormService), 'ensureAnonymousSession').and.resolveTo();
      const getGame = spyOn(TestBed.inject(GameRepositoryService), 'getGame').and.resolveTo({ currentEnemy: {}, Mob: [] });
      spyOn(TestBed.inject(UserRepositoryService), 'addJoinedGame').and.resolveTo();
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      await component.joinGame('game-from-my-games');
      await fixture.whenStable();

      expect(getGame).toHaveBeenCalledWith('game-from-my-games');
      expect(router.navigate).toHaveBeenCalledWith(['/game/game-from-my-games']);
    });

    it('loads the list of joined games once the account id becomes available', async () => {
      const userRepo = TestBed.inject(UserRepositoryService);
      spyOn(userRepo, 'getUser').and.resolveTo({ games: ['game-1', 'game-2'] });
      const store = TestBed.inject(Store);

      store.dispatch(new CurrentUserAction('user-1', 'Alice'));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.myGames()).toEqual(['game-1', 'game-2']);
    });
  });

  describe('deleteLocalSave (Issue #85)', () => {
    beforeEach(() => {
      localStorage.clear();
      TestBed.inject(LocalSingleplayerSaveService).createSave({
        saveId: 'local-7',
        updatedAt: 1234,
        game: { gameId: 'local-7', numberOfPlayers: 1 } as unknown as Game,
        player: {},
      });
      component.localSaves.set(TestBed.inject(LocalSingleplayerSaveService).listSaves());
    });

    afterEach(() => localStorage.clear());

    it('asks for confirmation before deleting anything', () => {
      const dialogOpen = spyOn(component.dialog, 'open').and.returnValue({
        afterClosed: () => of(undefined),
      } as MatDialogRef<unknown>);

      component.deleteLocalSave('local-7');

      expect(dialogOpen).toHaveBeenCalledWith(DialogConfirmComponent, jasmine.anything());
      expect(component.localSaves().map((save) => save.saveId)).toEqual(['local-7']);
    });

    it('removes the save from the list once confirmed', () => {
      spyOn(component.dialog, 'open').and.returnValue({
        afterClosed: () => of({ data: { confirmed: true } }),
      } as MatDialogRef<unknown>);

      component.deleteLocalSave('local-7');

      expect(component.localSaves()).toEqual([]);
      expect(TestBed.inject(LocalSingleplayerSaveService).listSaves()).toEqual([]);
    });
  });
});
