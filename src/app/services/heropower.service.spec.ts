import { TestBed } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { CardStackState } from 'src/app/states/cardStack-state';
import { cardsInHandState } from 'src/app/states/cardsInHand-state';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { EncounterState } from 'src/app/states/encounter-state';
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
      imports: [NgxsModule.forRoot([EncounterState, CardStackState, cardsInHandState, heropowerState, CurrentGameState])],
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

    service.resolveWalkuereHeropower('game-1', 'player-1');

    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('resolveArrayHeropower clears the enemy token, writes stats, and notifies the callback', async () => {
    const snapshot = store.snapshot();
    store.reset({
      ...snapshot,
      encounter: {
        ...snapshot['encounter'],
        currentEnemy: { name: 'Goblin', type: 'Monster', token: ['red'] },
      },
      heropower: { ...snapshot['heropower'], heropowerArray: ['red', 'yellow', 'green'], heropowerActivated: true },
    });

    const gameRepo = TestBed.inject(GameRepositoryService);
    const updateSpy = spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();
    spyOn(gameRepo, 'updateStats').and.resolveTo();
    const onEnemyTokenCleared = jasmine.createSpy('onEnemyTokenCleared');

    await service.resolveArrayHeropower('game-1', 'player-1', onEnemyTokenCleared);

    expect(updateSpy).toHaveBeenCalledWith('game-1', jasmine.objectContaining({ token: [] }));
    expect(onEnemyTokenCleared).toHaveBeenCalledWith(jasmine.objectContaining({ token: [] }));
  });
});
