import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxsModule, Store } from '@ngxs/store';
import { DialogAccountOfferComponent } from '../dialog-account-offer/dialog-account-offer.component';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { CardStackState } from 'src/app/states/cardStack-state';
import { cardsInHandState } from 'src/app/states/cardsInHand-state';
import { DeliveryStackState } from 'src/app/states/deliveryStack-state';
import { CurrentUserState } from 'src/app/states/currentUser-state';
import { EncounterState } from 'src/app/states/encounter-state';
import { heropowerState } from 'src/app/states/heropower-state';
import { LobbyState } from 'src/app/states/lobby-state';
import { TutorialState } from 'src/app/states/tutorial-state';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { PlayerRepositoryService } from 'src/app/services/player-repository.service';
import { CurrentUserAction } from 'src/app/actions/currentUser-action';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';

import { GameComponent } from './game.component';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let store: Store;

  beforeEach(async () => {
    ensureFirebaseTestAppInitialized();

    await TestBed.configureTestingModule({
    imports: [MatDialogModule, RouterTestingModule, NgxsModule.forRoot([CurrentGameState, CurrentUserState, heropowerState, CardStackState, cardsInHandState, DeliveryStackState, LobbyState, EncounterState, TutorialState]), GameComponent],
    providers: [...firestoreTestProviders(), { provide: Auth, useValue: { currentUser: null } }],
    schemas: [NO_ERRORS_SCHEMA],
})
    .compileComponents();

    ensureAngularFireSchedulersInitialized();

    // GameComponent.ngOnInit reads the current game id from the store synchronously and
    // builds a Firestore document path from it - an empty id (the state's default) makes
    // doc() throw synchronously ("Invalid document reference"). Seed a non-empty id so the
    // path is valid; see Issue #8 for untangling GameComponent's Firestore access from its
    // lifecycle.
    store = TestBed.inject(Store);
    const snapshot = store.snapshot();
    store.reset({ ...snapshot, currentGame: { ...snapshot['currentGame'], items: 'test-game-id' } });

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the full five-minute countdown before the first card is played', () => {
    expect(component.formattedRemainingTime()).toBe('05:00');
  });

  it('formats the remaining countdown from the stored timer start', () => {
    const now = Date.now();
    const snapshot = store.snapshot();
    store.reset({
      ...snapshot,
      currentGame: {
        ...snapshot['currentGame'],
        timerStartedAt: now - 125_000,
        timerDurationSeconds: 300,
      },
    });
    component.now.set(now);

    expect(component.formattedRemainingTime()).toBe('02:55');
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('account offer at singleplayer game end (Issue #75)', () => {
    function createLocalGameFixture(numberOfPlayers: number): ComponentFixture<GameComponent> {
      const snapshot = store.snapshot();
      store.reset({
        ...snapshot,
        currentGame: { ...snapshot['currentGame'], items: 'local-1', numberOfPlayers, gameStatus: 'playing' },
      });
      const localFixture = TestBed.createComponent(GameComponent);
      localFixture.detectChanges();
      return localFixture;
    }

    it('opens the account-offer dialog when a singleplayer local game ends in "won"', () => {
      const localFixture = createLocalGameFixture(1);
      const dialog = TestBed.inject(MatDialog);
      spyOn(dialog, 'open').and.returnValue({ afterClosed: () => ({ subscribe: () => {} }) } as never);

      const snapshot = store.snapshot();
      store.reset({ ...snapshot, currentGame: { ...snapshot['currentGame'], gameStatus: 'won' } });
      localFixture.detectChanges();

      expect(dialog.open).toHaveBeenCalledWith(DialogAccountOfferComponent, jasmine.anything());
      localFixture.destroy();
    });

    it('does not open the account-offer dialog for a multiplayer game', () => {
      const localFixture = createLocalGameFixture(2);
      const dialog = TestBed.inject(MatDialog);
      spyOn(dialog, 'open').and.returnValue({ afterClosed: () => ({ subscribe: () => {} }) } as never);

      const snapshot = store.snapshot();
      store.reset({ ...snapshot, currentGame: { ...snapshot['currentGame'], gameStatus: 'won' } });
      localFixture.detectChanges();

      expect(dialog.open).not.toHaveBeenCalled();
      localFixture.destroy();
    });
  });

  describe('rejoining after the own player document was deleted (Issue #77, TTL)', () => {
    beforeEach(() => {
      store.dispatch(new CurrentUserAction('current-user-id', 'Alice'));
    });

    it('loads the handstack normally when the own player document still exists', async () => {
      const gameRepo = TestBed.inject(GameRepositoryService);
      spyOn(gameRepo, 'getGame').and.resolveTo({
        choosenHeros: [{ playerId: 'current-user-id', playerName: 'Alice', playerHero: 'Barbar' }],
      });
      const playerRepo = TestBed.inject(PlayerRepositoryService);
      spyOn(playerRepo, 'getPlayer').and.resolveTo({ handstack: ['red'], deliveryStack: ['blue'] });
      const createPlayer = spyOn(playerRepo, 'createPlayer').and.resolveTo();

      await component.checkIfPlayerIsAlreadyPartOfGame();

      expect(createPlayer).not.toHaveBeenCalled();
      expect(store.selectSnapshot(CurrentHandSelector.currentHand)).toEqual(['red']);
    });

    it('falls back to creating a new player when the own document is gone despite being listed in choosenHeros', async () => {
      const gameRepo = TestBed.inject(GameRepositoryService);
      spyOn(gameRepo, 'getGame').and.resolveTo({
        choosenHeros: [{ playerId: 'current-user-id', playerName: 'Alice', playerHero: 'Barbar' }],
      });
      const playerRepo = TestBed.inject(PlayerRepositoryService);
      // TTL hat das Spieler-Unterdokument gelöscht (games/{gameId}/player/{playerId}), obwohl
      // der Spieler weiterhin im geteilten games/{gameId}-Dokument (choosenHeros) gelistet ist.
      spyOn(playerRepo, 'getPlayer').and.resolveTo(undefined);
      const createPlayer = spyOn(playerRepo, 'createPlayer').and.resolveTo();
      const dialog = TestBed.inject(MatDialog);
      const dialogOpen = spyOn(dialog, 'open').and.returnValue({ afterClosed: () => ({ subscribe: () => {} }) } as never);

      await component.checkIfPlayerIsAlreadyPartOfGame();

      expect(createPlayer).toHaveBeenCalled();
      expect(dialogOpen).toHaveBeenCalled();
    });
  });

  describe('deleteOwnMultiplayerData (Issue #85, "Spielstand löschen" für Multiplayer)', () => {
    beforeEach(() => {
      store.dispatch(new CurrentUserAction('current-user-id', 'Alice'));
      component.players = [
        { playerId: 'current-user-id', playerName: 'Alice', playerHero: 'Barbar' },
        { playerId: 'other-player-id', playerName: 'Bob', playerHero: 'Dieb' },
      ];
    });

    it('deletes the own player document and removes only the own entry from choosenHeros', async () => {
      const playerRepo = TestBed.inject(PlayerRepositoryService);
      const deleteOwnPlayerDoc = spyOn(playerRepo, 'deleteOwnPlayerDoc').and.resolveTo();
      const gameRepo = TestBed.inject(GameRepositoryService);
      const addPlayerToGame = spyOn(gameRepo, 'addPlayerToGame').and.resolveTo();
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      await component.deleteOwnMultiplayerData();

      expect(deleteOwnPlayerDoc).toHaveBeenCalledWith('test-game-id', 'current-user-id');
      expect(addPlayerToGame).toHaveBeenCalledWith('test-game-id', [
        { playerId: 'other-player-id', playerName: 'Bob', playerHero: 'Dieb' },
      ]);
      expect(router.navigate).toHaveBeenCalledWith(['/startscreen']);
    });

    it('shows an error and does not navigate away when deletion fails', async () => {
      const playerRepo = TestBed.inject(PlayerRepositoryService);
      spyOn(playerRepo, 'deleteOwnPlayerDoc').and.rejectWith(new Error('offline'));
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      await component.deleteOwnMultiplayerData();

      expect(component.loadError()).toBeTruthy();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
