import { Injectable } from '@angular/core';
import { GameRepositoryService } from './game-repository.service';
import { PlayerRepositoryService } from './player-repository.service';
import { LocalSingleplayerSaveService } from './local-singleplayer-save.service';

/**
 * Migriert lokale Singleplayer-Spielstände nach Firestore, sobald der Nutzer beim Spielende
 * (Issue #75, PR 3) einen Account erstellt. Schreibt neue, nicht-lokale gameIds
 * (crypto.randomUUID(), kein `local-`-Präfix) - der lokale Save bleibt unverändert zusätzlich
 * bestehen, es wird nichts gelöscht (Abstimmung mit Patrick, 2026-09-04).
 */
@Injectable({
  providedIn: 'root',
})
export class LocalSaveMigrationService {
  constructor(
    private localSaves: LocalSingleplayerSaveService,
    private gameRepo: GameRepositoryService,
    private playerRepo: PlayerRepositoryService
  ) {}

  async migrateAll(newUserId: string, newUserNickname: string): Promise<string[]> {
    const migratedGameIds: string[] = [];
    for (const save of this.localSaves.listSaves()) {
      const newGameId = crypto.randomUUID();
      const choosenHero = save.player['choosenHero'] as { heroname?: string } | undefined;
      await this.gameRepo.createGame(newGameId, {
        ...save.game,
        gameId: newGameId,
        choosenHeros: [{ playerId: newUserId, playerName: newUserNickname, playerHero: choosenHero?.heroname ?? '' }],
      });
      await this.playerRepo.createPlayer(newGameId, newUserId, save.player, {
        userId: newUserId,
        userNickname: newUserNickname,
        gameId: newGameId,
      });
      migratedGameIds.push(newGameId);
    }
    return migratedGameIds;
  }
}
