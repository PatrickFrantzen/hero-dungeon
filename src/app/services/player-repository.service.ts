import { Injectable } from '@angular/core';
import { DocumentData } from '@angular/fire/firestore';
import { FirestoreRepositoryService } from './firestore-repository.service';

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

  getPlayer(gameId: string, playerId: string): Promise<DocumentData | undefined> {
    return this.repo.getDoc(['games', gameId, 'player', playerId]);
  }

  /**
   * Legt das Spieler-Dokument in einem einzigen setDoc an (playerJson-Defaults, überschrieben
   * von updateData) statt setDoc gefolgt von updateDoc - vermeidet einen halb angelegten
   * Player-Zustand, falls der zweite Call fehlschlägt.
   */
  createPlayer(gameId: string, playerId: string, playerJson: object, updateData: object): Promise<void> {
    return this.repo.setDoc(['games', gameId, 'player', playerId], { ...playerJson, ...updateData });
  }

  updatePlayerChoosenHero(gameId: string, playerId: string, choosenHero: unknown): Promise<void> {
    return this.repo.updateFields(['games', gameId, 'player', playerId], { choosenHero });
  }

  updatePlayerCards(gameId: string, playerId: string, cardstack: string[], handstack: string[]): Promise<void> {
    return this.repo.updateFields(['games', gameId, 'player', playerId], { cardstack, handstack });
  }

  updateHandstack(gameId: string, playerId: string, update: string[]): Promise<void> {
    return this.repo.updateFields(['games', gameId, 'player', playerId], { handstack: update });
  }

  updateCardstack(gameId: string, playerId: string, update: string[]): Promise<void> {
    return this.repo.updateFields(['games', gameId, 'player', playerId], { cardstack: update });
  }

  updateDeliveryStack(gameId: string, playerId: string, update: string[]): Promise<void> {
    return this.repo.updateFields(['games', gameId, 'player', playerId], { deliveryStack: update });
  }
}
