import { Injectable } from '@angular/core';
import { Game } from 'src/models/game';

/** Bewusst ein loses Feld-Bag statt eines festen Interfaces: `games/{gameId}/player/{playerId}`
 * wird in GameRepositoryService/PlayerRepositoryService per generischem `updateFields(path,
 * patch: Partial<T>)` beschrieben (beliebige Teilmengen von userId/userNickname/choosenHero/
 * handstack/cardstack/deliveryStack je nach Aufrufstelle) - ein lokales Äquivalent muss dieselbe
 * Flexibilität haben, siehe LocalGameDocumentStoreService. */
export type LocalSingleplayerSavePlayer = Record<string, unknown>;

export interface LocalSingleplayerSave {
  saveId: string;
  updatedAt: number;
  game: Game;
  player: LocalSingleplayerSavePlayer;
}

/**
 * CRUD für lokale Singleplayer-Spielstände (LocalStorage) - Persistenz-Unterbau für
 * `docs/done/login-multiplayer-onboarding-plan.md` PR 1. Kein Firestore-Zugriff.
 */
const STORAGE_KEY = 'hero-dungeon.local-singleplayer-saves';

@Injectable({
  providedIn: 'root',
})
export class LocalSingleplayerSaveService {
  listSaves(): LocalSingleplayerSave[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  createSave(save: LocalSingleplayerSave): void {
    const saves = this.listSaves();
    saves.push(save);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  }

  getSave(saveId: string): LocalSingleplayerSave | undefined {
    return this.listSaves().find((save) => save.saveId === saveId);
  }

  updateSave(saveId: string, save: LocalSingleplayerSave): void {
    const saves = this.listSaves().map((existing) => (existing.saveId === saveId ? save : existing));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  }

  /** Issue #85: Singleplayer-Spielstand vollständig lokal löschen (im Unterschied zu
   * Multiplayer, wo nur der löschende Spieler entfernt wird, siehe
   * PlayerRepositoryService.deleteOwnPlayerDoc()/GameRepositoryService.addPlayerToGame()). */
  deleteSave(saveId: string): void {
    const saves = this.listSaves().filter((existing) => existing.saveId !== saveId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  }
}
