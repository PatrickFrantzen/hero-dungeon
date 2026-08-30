import { TestBed } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { CardStackState } from 'src/app/states/cardStack-state';
import { cardsInHandState } from 'src/app/states/cardsInHand-state';
import { DeliveryStackState } from 'src/app/states/deliveryStack-state';
import { EncounterState } from 'src/app/states/encounter-state';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { heropowerState } from 'src/app/states/heropower-state';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { CardPlayService } from './card-play.service';
import { GameRepositoryService } from './game-repository.service';
import { PlayerRepositoryService } from './player-repository.service';

describe('CardPlayService', () => {
  let service: CardPlayService;
  let store: Store;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([EncounterState, CardStackState, cardsInHandState, DeliveryStackState, heropowerState, CurrentGameState])],
      providers: firestoreTestProviders(),
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(CardPlayService);
    store = TestBed.inject(Store);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  function seedGameState(overrides: { hand?: string[]; cardStack?: string[]; enemy?: object; mob?: object[] }) {
    const snapshot = store.snapshot();
    store.reset({
      ...snapshot,
      encounter: {
        ...snapshot['encounter'],
        currentEnemy: overrides.enemy ?? { name: 'Goblin', type: 'Monster', token: ['red'] },
        Mob: overrides.mob ?? [],
      },
      cardsInHand: { ...snapshot['cardsInHand'], items: { cardstack: overrides.hand ?? [] } },
      cardStack: { ...snapshot['cardStack'], items: { cardstack: overrides.cardStack ?? [] } },
    });
  }

  it('chooseCard adds the card to the heropower selection while a heropower is active', () => {
    seedGameState({ hand: ['red'] });
    const snapshot = store.snapshot();
    store.reset({ ...snapshot, heropower: { ...snapshot['heropower'], heropowerActivated: true, heropowerArray: [] } });

    const gameRepo = TestBed.inject(GameRepositoryService);
    const updateSpy = spyOn(gameRepo, 'updateCurrentEnemyToken');
    const timerSpy = spyOn(gameRepo, 'updateTimerStartedAt').and.resolveTo();
    const reportWriteFailure = jasmine.createSpy('reportWriteFailure');

    service.chooseCard('game-1', 'player-1', 'red', reportWriteFailure);

    expect(updateSpy).not.toHaveBeenCalled();
    expect(timerSpy).not.toHaveBeenCalled();
  });

  it('chooseCard starts the five-minute timer and clears the matching enemy token when a single card matches', () => {
    spyOn(Date, 'now').and.returnValue(123456);
    seedGameState({
      hand: ['red'],
      cardStack: ['blue', 'green', 'yellow', 'purple', 'red_purple'],
      enemy: { name: 'Goblin', type: 'Monster', token: ['red'] },
    });

    const gameRepo = TestBed.inject(GameRepositoryService);
    const playerRepo = TestBed.inject(PlayerRepositoryService);
    spyOn(gameRepo, 'updateTimerStartedAt').and.resolveTo();
    spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();
    spyOn(playerRepo, 'updateHandstack').and.resolveTo();
    spyOn(playerRepo, 'updateDeliveryStack').and.resolveTo();
    const reportWriteFailure = jasmine.createSpy('reportWriteFailure');

    service.chooseCard('game-1', 'player-1', 'red', reportWriteFailure);

    expect(gameRepo.updateTimerStartedAt).toHaveBeenCalledWith('game-1', 123456);
    expect(store.selectSnapshot((state) => state.currentGame.timerStartedAt)).toBe(123456);
    expect(gameRepo.updateCurrentEnemyToken).toHaveBeenCalledWith(
      'game-1',
      jasmine.objectContaining({ token: [] })
    );
    expect(playerRepo.updateDeliveryStack).toHaveBeenCalledWith('game-1', 'player-1', ['red']);
    expect(reportWriteFailure).toHaveBeenCalled();
  });

  it('restCard discards the selected card and draws one replacement', () => {
    seedGameState({ hand: ['red', 'blue'], cardStack: ['green'], enemy: { name: 'Goblin', type: 'Monster', token: ['yellow'] } });

    const playerRepo = TestBed.inject(PlayerRepositoryService);
    spyOn(playerRepo, 'updateHandstack').and.resolveTo();
    spyOn(playerRepo, 'updateCardstack').and.resolveTo();
    spyOn(playerRepo, 'updateDeliveryStack').and.resolveTo();
    const reportWriteFailure = jasmine.createSpy('reportWriteFailure');

    service.restCard('game-1', 'player-1', 'red', reportWriteFailure);

    expect(store.selectSnapshot((state) => state.cardsInHand.items.cardstack)).toEqual(['blue', 'green']);
    expect(store.selectSnapshot((state) => state.cardStack.items.cardstack)).toEqual([]);
    expect(store.selectSnapshot((state) => state.deliveryStack.items)).toEqual(['red']);
    expect(playerRepo.updateDeliveryStack).toHaveBeenCalledWith('game-1', 'player-1', ['red']);
  });

  it('resolveSoloEvent applies Plötzliche Krankheit by discarding the full hand and drawing back to five', () => {
    seedGameState({
      hand: ['red', 'blue'],
      cardStack: ['green', 'yellow', 'purple', 'red_purple', 'green_green'],
      enemy: { name: 'Plötzliche Krankheit', type: 'Jeder legt alle Handkarten auf den eigenen Ablagestapel.', token: ['event'] },
      mob: [{ name: 'Next', type: 'Monster', token: ['red'] }],
    });

    const gameRepo = TestBed.inject(GameRepositoryService);
    const playerRepo = TestBed.inject(PlayerRepositoryService);
    spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();
    spyOn(gameRepo, 'updateNewMob').and.resolveTo();
    spyOn(playerRepo, 'updateHandstack').and.resolveTo();
    spyOn(playerRepo, 'updateCardstack').and.resolveTo();
    spyOn(playerRepo, 'updateDeliveryStack').and.resolveTo();
    const reportWriteFailure = jasmine.createSpy('reportWriteFailure');

    service.resolveSoloEvent('game-1', 'player-1', reportWriteFailure);

    expect(store.selectSnapshot((state) => state.cardsInHand.items.cardstack).length).toBe(5);
    expect(store.selectSnapshot((state) => state.deliveryStack.items)).toEqual(['red', 'blue']);
    expect(store.selectSnapshot((state) => state.encounter.currentEnemy).name).toBe('Next');
  });

  it('chooseCard resolves a Joker card as any single symbol of the current threat', () => {
    seedGameState({
      hand: ['joker'],
      cardStack: ['blue'],
      enemy: { name: 'Goblin', type: 'Monster', token: ['red', 'green'] },
    });

    const gameRepo = TestBed.inject(GameRepositoryService);
    const playerRepo = TestBed.inject(PlayerRepositoryService);
    spyOn(gameRepo, 'updateTimerStartedAt').and.resolveTo();
    spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();
    spyOn(playerRepo, 'updateHandstack').and.resolveTo();
    spyOn(playerRepo, 'updateDeliveryStack').and.resolveTo();
    const reportWriteFailure = jasmine.createSpy('reportWriteFailure');

    service.chooseCard('game-1', 'player-1', 'joker', reportWriteFailure);

    expect(store.selectSnapshot((state) => state.encounter.currentEnemy.token)).toEqual(['green']);
    expect(gameRepo.updateCurrentEnemyToken).toHaveBeenCalledWith('game-1', jasmine.objectContaining({ token: ['green'] }));
  });

  it('chooseCard does nothing for a Joker card against an event threat', () => {
    seedGameState({
      hand: ['joker'],
      enemy: { name: 'Chaos', type: 'Jeder gibt seine Handkarten einem Mitspieler.', token: ['event'] },
    });

    const gameRepo = TestBed.inject(GameRepositoryService);
    spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();
    const reportWriteFailure = jasmine.createSpy('reportWriteFailure');

    service.chooseCard('game-1', 'player-1', 'joker', reportWriteFailure);

    expect(gameRepo.updateCurrentEnemyToken).not.toHaveBeenCalled();
    expect(store.selectSnapshot((state) => state.cardsInHand.items.cardstack)).toEqual(['joker']);
  });

  it('chooseCard resolves a Magische Bombe by removing one occurrence of each present symbol', () => {
    seedGameState({
      hand: ['magischeBombe'],
      cardStack: ['blue'],
      enemy: { name: 'Zola, die Gorgone', type: 'Boss', token: ['red', 'red', 'yellow', 'purple'] },
    });

    const gameRepo = TestBed.inject(GameRepositoryService);
    const playerRepo = TestBed.inject(PlayerRepositoryService);
    spyOn(gameRepo, 'updateTimerStartedAt').and.resolveTo();
    spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();
    spyOn(playerRepo, 'updateHandstack').and.resolveTo();
    spyOn(playerRepo, 'updateDeliveryStack').and.resolveTo();
    const reportWriteFailure = jasmine.createSpy('reportWriteFailure');

    service.chooseCard('game-1', 'player-1', 'magischeBombe', reportWriteFailure);

    expect(store.selectSnapshot((state) => state.encounter.currentEnemy.token)).toEqual(['red']);
  });

  it('chooseCard marks the game as won when Baby-Barbar is defeated after the mob stack is empty', () => {
    seedGameState({ hand: ['red'], enemy: { name: 'Baby-Barbar', type: 'Boss', token: ['red'] }, mob: [] });

    const gameRepo = TestBed.inject(GameRepositoryService);
    const playerRepo = TestBed.inject(PlayerRepositoryService);
    spyOn(gameRepo, 'updateTimerStartedAt').and.resolveTo();
    spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();
    spyOn(gameRepo, 'updateGameStatus').and.resolveTo();
    spyOn(playerRepo, 'updateHandstack').and.resolveTo();
    spyOn(playerRepo, 'updateDeliveryStack').and.resolveTo();
    const reportWriteFailure = jasmine.createSpy('reportWriteFailure');

    service.chooseCard('game-1', 'player-1', 'red', reportWriteFailure);

    expect(gameRepo.updateGameStatus).toHaveBeenCalledWith('game-1', 'won');
  });
});
