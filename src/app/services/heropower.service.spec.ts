import { TestBed } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { CardStackState } from 'src/app/states/cardStack-state';
import { cardsInHandState } from 'src/app/states/cardsInHand-state';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { heropowerState } from 'src/app/states/heropower-state';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { GameRepositoryService } from './game-repository.service';
import { HeropowerService } from './heropower.service';
import { PlayerRepositoryService } from './player-repository.service';

describe('HeropowerService', () => {
  let service: HeropowerService;
  let store: Store;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([CurrentGameState, CardStackState, cardsInHandState, heropowerState])],
      providers: firestoreTestProviders(),
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(HeropowerService);
    store = TestBed.inject(Store);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('resolveWalkuereHeropower does nothing if fewer than 3 heropower cards are selected', () => {
    const playerRepo = TestBed.inject(PlayerRepositoryService);
    const writeSpy = spyOn(playerRepo, 'updateHandstack');
    const reportWriteFailure = jasmine.createSpy('reportWriteFailure');

    service.resolveWalkuereHeropower('game-1', 'player-1', reportWriteFailure);

    expect(writeSpy).not.toHaveBeenCalled();
    expect(reportWriteFailure).not.toHaveBeenCalled();
  });

  it('resolveArrayHeropower clears the enemy token, reports the write, and notifies the callback', () => {
    const snapshot = store.snapshot();
    store.reset({
      ...snapshot,
      currentGame: {
        ...snapshot['currentGame'],
        game: { ...snapshot['currentGame'].game, currentEnemy: { name: 'Goblin', type: 'Monster', token: ['red'] } },
      },
      heropower: { ...snapshot['heropower'], heropowerArray: ['red', 'yellow', 'green'], heropowerActivated: true },
    });

    const gameRepo = TestBed.inject(GameRepositoryService);
    const updateSpy = spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();
    const reportWriteFailure = jasmine.createSpy('reportWriteFailure');
    const onEnemyTokenCleared = jasmine.createSpy('onEnemyTokenCleared');

    service.resolveArrayHeropower('game-1', 'player-1', reportWriteFailure, onEnemyTokenCleared);

    expect(updateSpy).toHaveBeenCalledWith('game-1', jasmine.objectContaining({ token: [] }));
    expect(reportWriteFailure).toHaveBeenCalled();
    expect(onEnemyTokenCleared).toHaveBeenCalledWith(jasmine.objectContaining({ token: [] }));
  });
});
