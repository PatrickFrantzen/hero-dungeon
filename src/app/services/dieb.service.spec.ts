import { TestBed } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { CardStackState } from 'src/app/states/cardStack-state';
import { cardsInHandState } from 'src/app/states/cardsInHand-state';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { CurrentUserState } from 'src/app/states/currentUser-state';
import { DeliveryStackState } from 'src/app/states/deliveryStack-state';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { DiebService } from './dieb.service';
import { GameRepositoryService } from './game-repository.service';
import { PlayerRepositoryService } from './player-repository.service';

describe('DiebService', () => {
  let service: DiebService;
  let store: Store;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([CardStackState, cardsInHandState, CurrentGameState, CurrentUserState, DeliveryStackState]),
      ],
      providers: firestoreTestProviders(),
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(DiebService);
    store = TestBed.inject(Store);
  });

  function seedGameState(overrides: {
    hand?: string[];
    cardStack?: string[];
    deliveryStack?: string[];
    gameId?: string;
    playerId?: string;
  }) {
    const snapshot = store.snapshot();
    store.reset({
      ...snapshot,
      cardsInHand: { ...snapshot['cardsInHand'], items: { cardstack: overrides.hand ?? [] } },
      cardStack: { ...snapshot['cardStack'], items: { cardstack: overrides.cardStack ?? [] } },
      deliveryStack: { ...snapshot['deliveryStack'], items: overrides.deliveryStack ?? [] },
      currentGame: { ...snapshot['currentGame'], items: overrides.gameId ?? 'game-1' },
      currentUser: { ...snapshot['currentUser'], items: { id: overrides.playerId ?? 'player-1' } },
    });
  }

  function stubWrites() {
    const gameRepo = TestBed.inject(GameRepositoryService);
    const playerRepo = TestBed.inject(PlayerRepositoryService);
    spyOn(gameRepo, 'updateStats').and.resolveTo();
    spyOn(playerRepo, 'updateHandstack').and.resolveTo();
    spyOn(playerRepo, 'updateCardstack').and.resolveTo();
    spyOn(playerRepo, 'updateDeliveryStack').and.resolveTo();
    return { gameRepo, playerRepo };
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('heropower() counts the Dieb heropower usage towards the heropowersUsed statistic (Bug B)', () => {
    seedGameState({ hand: ['red', 'blue', 'green'], cardStack: ['yellow', 'purple'] });
    const { gameRepo } = stubWrites();

    service.heropower(['red', 'blue', 'green']);

    expect(store.selectSnapshot((state) => state.currentGame.stats.heropowersUsed)).toBe(1);
    expect(gameRepo.updateStats).toHaveBeenCalledWith('game-1', jasmine.objectContaining({ heropowersUsed: 1 }));
  });

  it('discards the 3 selected cards onto the delivery stack instead of removing them from the game', () => {
    seedGameState({ hand: ['red', 'blue', 'green'], cardStack: ['yellow', 'purple'], deliveryStack: ['purple'] });
    stubWrites();

    service.heropower(['red', 'blue', 'green']);

    expect(store.selectSnapshot((state) => state.deliveryStack.items)).toEqual(['purple', 'red', 'blue', 'green']);
  });

  it('updates the local card stack signal so a repeated heropower use does not redraw the same cards', () => {
    // Regression test: previously heropower() only wrote the shrunk card stack to
    // Firestore/LocalStorage, never dispatching UpdateCardStackAction. In singleplayer (no
    // live Firestore sync back into the store, see player-hand/CLAUDE.md) this left
    // currentCardStack frozen for the rest of the session - a second heropower use (or any
    // other draw) re-read the same, un-shrunk stack and drew already-dealt cards a second
    // time, showing up as duplicated hand cards (e.g. 4x "stehlen" from a 2-copy deck).
    seedGameState({ hand: ['red', 'blue', 'green'], cardStack: ['yellow', 'purple', 'stehlen', 'orange', 'pink'] });
    stubWrites();

    service.heropower(['red', 'blue', 'green']);

    expect(store.selectSnapshot((state) => state.cardStack.items.cardstack)).toEqual([]);
    expect(store.selectSnapshot((state) => state.cardsInHand.items.cardstack)).toEqual([
      'yellow',
      'purple',
      'stehlen',
      'orange',
      'pink',
    ]);
  });
});
