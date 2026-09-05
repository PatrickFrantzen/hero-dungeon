import { TestBed } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { CardStackState } from 'src/app/states/cardStack-state';
import { cardsInHandState } from 'src/app/states/cardsInHand-state';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { CurrentUserState } from 'src/app/states/currentUser-state';
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
      imports: [NgxsModule.forRoot([CardStackState, cardsInHandState, CurrentGameState, CurrentUserState])],
      providers: firestoreTestProviders(),
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(DiebService);
    store = TestBed.inject(Store);
  });

  function seedGameState(overrides: { hand?: string[]; cardStack?: string[]; gameId?: string; playerId?: string }) {
    const snapshot = store.snapshot();
    store.reset({
      ...snapshot,
      cardsInHand: { ...snapshot['cardsInHand'], items: { cardstack: overrides.hand ?? [] } },
      cardStack: { ...snapshot['cardStack'], items: { cardstack: overrides.cardStack ?? [] } },
      currentGame: { ...snapshot['currentGame'], items: overrides.gameId ?? 'game-1' },
      currentUser: { ...snapshot['currentUser'], items: { id: overrides.playerId ?? 'player-1' } },
    });
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('heropower() counts the Dieb heropower usage towards the heropowersUsed statistic (Bug B)', () => {
    seedGameState({ hand: ['red', 'blue', 'green'], cardStack: ['yellow', 'purple'] });

    const gameRepo = TestBed.inject(GameRepositoryService);
    const playerRepo = TestBed.inject(PlayerRepositoryService);
    const statsSpy = spyOn(gameRepo, 'updateStats').and.resolveTo();
    spyOn(playerRepo, 'updateHandstack').and.resolveTo();
    spyOn(playerRepo, 'updateCardstack').and.resolveTo();

    service.heropower(['red', 'blue', 'green']);

    expect(store.selectSnapshot((state) => state.currentGame.stats.heropowersUsed)).toBe(1);
    expect(statsSpy).toHaveBeenCalledWith('game-1', jasmine.objectContaining({ heropowersUsed: 1 }));
  });
});
