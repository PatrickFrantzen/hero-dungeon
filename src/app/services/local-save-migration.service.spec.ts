import { TestBed } from '@angular/core/testing';
import { Game } from 'src/models/game';
import { isLocalGameId } from './local-game-id.util';
import { GameRepositoryService } from './game-repository.service';
import { PlayerRepositoryService } from './player-repository.service';
import { LocalSingleplayerSaveService } from './local-singleplayer-save.service';
import { LocalSaveMigrationService } from './local-save-migration.service';

describe('LocalSaveMigrationService', () => {
  let service: LocalSaveMigrationService;
  let gameRepo: jasmine.SpyObj<GameRepositoryService>;
  let playerRepo: jasmine.SpyObj<PlayerRepositoryService>;

  beforeEach(() => {
    localStorage.clear();
    gameRepo = jasmine.createSpyObj('GameRepositoryService', ['createGame']);
    playerRepo = jasmine.createSpyObj('PlayerRepositoryService', ['createPlayer']);
    gameRepo.createGame.and.resolveTo(undefined);
    playerRepo.createPlayer.and.resolveTo(undefined);

    TestBed.configureTestingModule({
      providers: [
        { provide: GameRepositoryService, useValue: gameRepo },
        { provide: PlayerRepositoryService, useValue: playerRepo },
      ],
    });
    service = TestBed.inject(LocalSaveMigrationService);
  });

  afterEach(() => localStorage.clear());

  it('migrateAll() does nothing when there are no local saves', async () => {
    const migratedGameIds = await service.migrateAll('new-uid', 'Gast');

    expect(migratedGameIds).toEqual([]);
    expect(gameRepo.createGame).not.toHaveBeenCalled();
  });

  it('migrateAll() writes one local save to Firestore under a fresh, non-local gameId', async () => {
    TestBed.inject(LocalSingleplayerSaveService).createSave({
      saveId: 'local-1',
      updatedAt: Date.now(),
      game: { numberOfPlayers: 1, gameStatus: 'won' } as unknown as Game,
      player: { handstack: ['red'], cardstack: [], deliveryStack: [], choosenHero: { heroname: 'Dieb' } },
    });

    const migratedGameIds = await service.migrateAll('new-uid', 'Gast');

    expect(migratedGameIds.length).toBe(1);
    expect(isLocalGameId(migratedGameIds[0])).toBeFalse();
    expect(gameRepo.createGame).toHaveBeenCalledTimes(1);
    expect(playerRepo.createPlayer).toHaveBeenCalledWith(
      migratedGameIds[0],
      'new-uid',
      jasmine.objectContaining({ handstack: ['red'] }),
      jasmine.objectContaining({ userId: 'new-uid', userNickname: 'Gast' })
    );
  });

  it('migrateAll() migrates every local save, each under its own gameId', async () => {
    const localSaveService = TestBed.inject(LocalSingleplayerSaveService);
    localSaveService.createSave({ saveId: 'local-1', updatedAt: 1, game: {} as Game, player: {} });
    localSaveService.createSave({ saveId: 'local-2', updatedAt: 2, game: {} as Game, player: {} });

    const migratedGameIds = await service.migrateAll('new-uid', 'Gast');

    expect(migratedGameIds.length).toBe(2);
    expect(new Set(migratedGameIds).size).toBe(2);
    expect(gameRepo.createGame).toHaveBeenCalledTimes(2);
    expect(playerRepo.createPlayer).toHaveBeenCalledTimes(2);
  });
});
