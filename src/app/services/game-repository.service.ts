import { Injectable } from '@angular/core';
import { DocumentData, serverTimestamp } from '@angular/fire/firestore';
import { GameStats, GameStatus } from 'src/models/game';
import { Mob } from 'src/models/monster/monster.class';
import { FirestoreRepositoryService } from './firestore-repository.service';
import { isLocalGameId } from './local-game-id.util';

/**
 * Alle Firestore-Zugriffe auf das `games/{gameId}`-Dokument selbst (Gegner/Mob/Boss,
 * Quest-Flag, Spielerliste). Ersetzt LoadGameService/GamePlayerService/SaveGameService, die
 * dieselben Felder bisher redundant über drei Klassen gelesen/geschrieben haben.
 */
@Injectable({
  providedIn: 'root',
})
export class GameRepositoryService {
  constructor(private repo: FirestoreRepositoryService) {}

  /**
   * `lastActivityAt` (Issue #76, PR 4) ist die Grundlage der 7-Tage-TTL-Policy auf anonyme
   * Multiplayer-Spieldaten (PR 5) - ein reines Firestore-Detail, das für lokale
   * Singleplayer-Spielstände (LocalStorage, siehe FirestoreRepositoryService.isLocalPath())
   * keine Bedeutung hat. Bewusste Ausnahme vom sonst gültigen "keine eigene lokal/Firestore-
   * Fallunterscheidung in dieser Klasse"-Prinzip (services/CLAUDE.md) - ohne diesen Guard würde
   * ein Firestore-`serverTimestamp()`-Sentinel in einem lokalen Spielstand landen.
   */
  private withActivity<T extends object>(gameId: string, fields: T): T {
    return isLocalGameId(gameId) ? fields : { ...fields, lastActivityAt: serverTimestamp() };
  }

  getGame(gameId: string): Promise<DocumentData | undefined> {
    return this.repo.getDoc(['games', gameId]);
  }

  createGame(gameId: string, game: object): Promise<void> {
    return this.repo.setDoc(['games', gameId], this.withActivity(gameId, game));
  }

  addPlayerToGame(gameId: string, choosenHeros: unknown[]): Promise<void> {
    return this.repo.updateFields(['games', gameId], this.withActivity(gameId, { choosenHeros }));
  }

  updateCurrentEnemyToken(gameId: string, update: Mob | Mob[]): Promise<void> {
    return this.repo.updateFields(['games', gameId], this.withActivity(gameId, { currentEnemy: update }));
  }

  updateNewMob(gameId: string, update: Mob | Mob[]): Promise<void> {
    return this.repo.updateFields(['games', gameId], this.withActivity(gameId, { Mob: update }));
  }

  updateQuestStatus(gameId: string, update: boolean): Promise<void> {
    return this.repo.updateFields(['games', gameId], this.withActivity(gameId, { questCardActivated: update }));
  }

  updateGameStatus(gameId: string, gameStatus: GameStatus): Promise<void> {
    return this.repo.updateFields(
      ['games', gameId],
      this.withActivity(gameId, { gameStatus, isLost: gameStatus === 'lost' })
    );
  }

  updateTimerStartedAt(gameId: string, timerStartedAt: number): Promise<void> {
    return this.repo.updateFields(['games', gameId], this.withActivity(gameId, { timerStartedAt }));
  }

  updateTimerPauseState(gameId: string, timerPausedAt: number | null, timerPausedSecondsTotal: number): Promise<void> {
    return this.repo.updateFields(
      ['games', gameId],
      this.withActivity(gameId, { timerPausedAt, timerPausedSecondsTotal })
    );
  }

  resetTimer(gameId: string): Promise<void> {
    return this.repo.updateFields(
      ['games', gameId],
      this.withActivity(gameId, {
        timerStartedAt: null,
        timerPausedAt: null,
        timerPausedSecondsTotal: 0,
      })
    );
  }

  updateCurrentBoss(gameId: string, currentBoss: Mob): Promise<void> {
    return this.repo.updateFields(['games', gameId], this.withActivity(gameId, { currentBoss }));
  }

  updateRemainingBosses(gameId: string, allBosses: Mob[]): Promise<void> {
    return this.repo.updateFields(['games', gameId], this.withActivity(gameId, { allBosses }));
  }

  updateStats(gameId: string, stats: GameStats): Promise<void> {
    return this.repo.updateFields(['games', gameId], this.withActivity(gameId, { stats }));
  }
}
