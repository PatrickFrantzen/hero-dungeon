import { Injectable } from '@angular/core';
import { DocumentData, serverTimestamp } from '@angular/fire/firestore';
import { FirestoreRepositoryService } from './firestore-repository.service';
import { isLocalGameId } from './local-game-id.util';

/**
 * Alle Firestore-Zugriffe auf ein `games/{gameId}/player/{playerId}`-Dokument (Hand-/
 * Kartenstapel, gewählter Held). Ersetzt LoadGameService/GamePlayerService/SaveGameService,
 * die dieselben Felder bisher redundant über drei Klassen gelesen/geschrieben haben.
 */
@Injectable({
  providedIn: 'root',
})
export class PlayerRepositoryService {
  constructor(private repo: FirestoreRepositoryService) {}

  /** Siehe GameRepositoryService.withActivity() - gleiche bewusste Ausnahme, gleicher Grund. */
  private withActivity<T extends object>(gameId: string, fields: T): T {
    return isLocalGameId(gameId) ? fields : { ...fields, lastActivityAt: serverTimestamp() };
  }

  getPlayer(gameId: string, playerId: string): Promise<DocumentData | undefined> {
    return this.repo.getDoc(['games', gameId, 'player', playerId]);
  }

  /**
   * Legt das Spieler-Dokument in einem einzigen setDoc an (playerJson-Defaults, überschrieben
   * von updateData) statt setDoc gefolgt von updateDoc - vermeidet einen halb angelegten
   * Player-Zustand, falls der zweite Call fehlschlägt.
   */
  createPlayer(gameId: string, playerId: string, playerJson: object, updateData: object): Promise<void> {
    return this.repo.setDoc(
      ['games', gameId, 'player', playerId],
      this.withActivity(gameId, { ...playerJson, ...updateData })
    );
  }

  updatePlayerChoosenHero(gameId: string, playerId: string, choosenHero: unknown): Promise<void> {
    return this.repo.updateFields(['games', gameId, 'player', playerId], this.withActivity(gameId, { choosenHero }));
  }

  updatePlayerCards(gameId: string, playerId: string, cardstack: string[], handstack: string[]): Promise<void> {
    return this.repo.updateFields(
      ['games', gameId, 'player', playerId],
      this.withActivity(gameId, { cardstack, handstack })
    );
  }

  updateHandstack(gameId: string, playerId: string, update: string[]): Promise<void> {
    return this.repo.updateFields(
      ['games', gameId, 'player', playerId],
      this.withActivity(gameId, { handstack: update })
    );
  }

  updateCardstack(gameId: string, playerId: string, update: string[]): Promise<void> {
    return this.repo.updateFields(
      ['games', gameId, 'player', playerId],
      this.withActivity(gameId, { cardstack: update })
    );
  }

  updateDeliveryStack(gameId: string, playerId: string, update: string[]): Promise<void> {
    return this.repo.updateFields(
      ['games', gameId, 'player', playerId],
      this.withActivity(gameId, { deliveryStack: update })
    );
  }

  /** Issue #85: "Spielstand löschen" für Multiplayer - löscht nur das eigene Spieler-
   * Unterdokument, das Spiel selbst bleibt für die übrigen Mitspieler bestehen (die bereits
   * durch Issue #77/PR 5 robust gegen ein fehlendes Mitspieler-Dokument sind). Der Aufrufer
   * muss zusätzlich den eigenen Eintrag aus `games/{gameId}.choosenHeros` entfernen
   * (`GameRepositoryService.addPlayerToGame()` mit der gefilterten Liste). */
  deleteOwnPlayerDoc(gameId: string, playerId: string): Promise<void> {
    return this.repo.deleteDoc(['games', gameId, 'player', playerId]);
  }
}
