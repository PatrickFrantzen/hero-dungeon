import { TestBed } from '@angular/core/testing';
import { NgxsModule, Store } from '@ngxs/store';
import { CardStackState } from 'src/app/states/cardStack-state';
import { cardsInHandState } from 'src/app/states/cardsInHand-state';
import { DeliveryStackState } from 'src/app/states/deliveryStack-state';
import { EncounterState } from 'src/app/states/encounter-state';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';
import { LocalSingleplayerSaveService } from './local-singleplayer-save.service';
import { Game } from 'src/models/game';

import { DungeonProgressionService } from './dungeon-progression.service';
import { GameRepositoryService } from './game-repository.service';
import { PlayerRepositoryService } from './player-repository.service';

describe('DungeonProgressionService', () => {
  let service: DungeonProgressionService;
  let store: Store;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([EncounterState, CardStackState, cardsInHandState, DeliveryStackState, CurrentGameState])],
      providers: firestoreTestProviders(),
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(DungeonProgressionService);
    store = TestBed.inject(Store);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  function seedBossQueue(allBosses: object[], numberOfPlayers = 1, difficulty = 'easy') {
    const snapshot = store.snapshot();
    store.reset({
      ...snapshot,
      encounter: { ...snapshot['encounter'], allBosses },
      currentGame: { ...snapshot['currentGame'], numberOfPlayers, difficulty },
    });
  }

  describe('continueToNextDungeon()', () => {
    it('does nothing when no boss remains in the queue', async () => {
      seedBossQueue([]);
      const gameRepo = TestBed.inject(GameRepositoryService);
      const updateBossSpy = spyOn(gameRepo, 'updateCurrentBoss');

      await service.continueToNextDungeon('game-1', 'player-1');

      expect(updateBossSpy).not.toHaveBeenCalled();
    });

    it('advances to the next boss, resets the timer and marks the game playing again', async () => {
      // Lokale gameId (Issue #87-Umschaltpunkt): reshuffleAllPlayersForNewDungeon()'s
      // repo.queryAll() bleibt damit synchron auf LocalStorage statt gegen die echte
      // Firestore-Instanz zu laufen (kein Netzwerk in dieser Sandbox erreichbar).
      // gameRepo selbst ist unten vollständig gespiegelt - dessen lokal/Firestore-Umschaltung
      // spielt für diesen Test keine Rolle.
      localStorage.clear();
      seedBossQueue([{ name: 'Der Flecken-Schrecken', token: [], type: 'Boss' }]);
      const gameRepo = TestBed.inject(GameRepositoryService);
      spyOn(gameRepo, 'updateCurrentBoss').and.resolveTo();
      spyOn(gameRepo, 'updateRemainingBosses').and.resolveTo();
      spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();
      spyOn(gameRepo, 'updateNewMob').and.resolveTo();
      spyOn(gameRepo, 'resetTimer').and.resolveTo();
      spyOn(gameRepo, 'updateGameStatus').and.resolveTo();
      const playerRepo = TestBed.inject(PlayerRepositoryService);
      spyOn(playerRepo, 'updateHandstack').and.resolveTo();
      spyOn(playerRepo, 'updateCardstack').and.resolveTo();
      spyOn(playerRepo, 'updateDeliveryStack').and.resolveTo();

      await service.continueToNextDungeon('local-2', 'player-1');

      expect(gameRepo.updateCurrentBoss).toHaveBeenCalledWith('local-2', jasmine.objectContaining({ name: 'Der Flecken-Schrecken' }));
      expect(gameRepo.resetTimer).toHaveBeenCalledWith('local-2');
      expect(gameRepo.updateGameStatus).toHaveBeenCalledWith('local-2', 'playing');
      expect(store.selectSnapshot((state) => state.encounter.allBosses)).toEqual([]);
      expect(store.selectSnapshot((state) => state.currentGame.gameStatus)).toBe('playing');
      localStorage.clear();
    });

    it('reshuffles the local singleplayer player hand back to full size (Issue #87 Regression)', async () => {
      localStorage.clear();
      seedBossQueue([{ name: 'Der Flecken-Schrecken', token: [], type: 'Boss' }]);
      TestBed.inject(LocalSingleplayerSaveService).createSave({
        saveId: 'local-1',
        updatedAt: Date.now(),
        game: { gameId: 'local-1', numberOfPlayers: 1 } as unknown as Game,
        player: {
          userId: 'solo',
          gameId: 'local-1',
          choosenHero: { heroname: 'Barbar' },
          handstack: ['unchanged-1', 'unchanged-2'],
          cardstack: [],
          deliveryStack: [],
        },
      });

      await service.continueToNextDungeon('local-1', 'solo');
      // reshuffleAllPlayersForNewDungeon() liest den lokalen Spieler asynchron per queryAll() -
      // ein Tick genügt, da LocalGameDocumentStoreService synchron auf LocalStorage arbeitet.
      await Promise.resolve();
      await Promise.resolve();

      const handAfter = TestBed.inject(LocalSingleplayerSaveService).getSave('local-1')?.player['handstack'];
      expect(handAfter).not.toEqual(['unchanged-1', 'unchanged-2']);
      expect((handAfter as string[]).length).toBe(5);

      localStorage.clear();
    });
  });

  describe('restartCampaign()', () => {
    it('rebuilds the dungeon back at boss #1 and marks the game playing again', async () => {
      localStorage.clear();
      const snapshot = store.snapshot();
      store.reset({ ...snapshot, currentGame: { ...snapshot['currentGame'], numberOfPlayers: 1, difficulty: 'easy', gameStatus: 'lost' } });

      const gameRepo = TestBed.inject(GameRepositoryService);
      spyOn(gameRepo, 'updateCurrentBoss').and.resolveTo();
      spyOn(gameRepo, 'updateRemainingBosses').and.resolveTo();
      spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();
      spyOn(gameRepo, 'updateNewMob').and.resolveTo();
      spyOn(gameRepo, 'resetTimer').and.resolveTo();
      spyOn(gameRepo, 'updateGameStatus').and.resolveTo();
      const playerRepo = TestBed.inject(PlayerRepositoryService);
      spyOn(playerRepo, 'updateHandstack').and.resolveTo();
      spyOn(playerRepo, 'updateCardstack').and.resolveTo();
      spyOn(playerRepo, 'updateDeliveryStack').and.resolveTo();

      // Lokale gameId, siehe Kommentar in continueToNextDungeon()-Test oben.
      await service.restartCampaign('local-3', 'player-1');

      expect(gameRepo.updateGameStatus).toHaveBeenCalledWith('local-3', 'playing');
      expect(store.selectSnapshot((state) => state.currentGame.gameStatus)).toBe('playing');
      expect(store.selectSnapshot((state) => state.encounter.currentBoss).name).toBe('Baby-Barbar');
      localStorage.clear();
    });
  });

  describe('getNextEnemy()', () => {
    it('shifts the next mob off the queue and dispatches it as the current enemy', async () => {
      const snapshot = store.snapshot();
      store.reset({
        ...snapshot,
        encounter: {
          ...snapshot['encounter'],
          Mob: [{ name: 'Next', type: 'Monster', token: ['red'] }],
        },
      });
      const gameRepo = TestBed.inject(GameRepositoryService);
      spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();
      spyOn(gameRepo, 'updateNewMob').and.resolveTo();

      await service.getNextEnemy('game-1');

      expect(store.selectSnapshot((state) => state.encounter.currentEnemy).name).toBe('Next');
      expect(store.selectSnapshot((state) => state.encounter.Mob)).toEqual([]);
      expect(gameRepo.updateCurrentEnemyToken).toHaveBeenCalledWith('game-1', jasmine.objectContaining({ name: 'Next' }));
    });
  });

  describe('getNextBoss()', () => {
    it('sets the current boss as the current enemy', async () => {
      const snapshot = store.snapshot();
      store.reset({
        ...snapshot,
        encounter: { ...snapshot['encounter'], currentBoss: { name: 'Zola, die Gorgone', type: 'Boss', token: [] } },
      });
      const gameRepo = TestBed.inject(GameRepositoryService);
      spyOn(gameRepo, 'updateCurrentEnemyToken').and.resolveTo();

      await service.getNextBoss('game-1');

      expect(store.selectSnapshot((state) => state.encounter.currentEnemy).name).toBe('Zola, die Gorgone');
      expect(gameRepo.updateCurrentEnemyToken).toHaveBeenCalledWith('game-1', jasmine.objectContaining({ name: 'Zola, die Gorgone' }));
    });
  });
});
