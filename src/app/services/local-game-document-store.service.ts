import { Injectable } from '@angular/core';
import { DocumentData } from '@angular/fire/firestore';
import { Game } from 'src/models/game';
import { LocalSingleplayerSavePlayer, LocalSingleplayerSaveService } from './local-singleplayer-save.service';

/**
 * Bildet dieselbe getDoc/setDoc/updateFields-Semantik wie FirestoreRepositoryService ab, aber
 * für lokale Singleplayer-Spielstände (LocalSingleplayerSaveService) statt Firestore. Kennt nur
 * zwei Pfadformen, dieselben, die GameRepositoryService/PlayerRepositoryService verwenden:
 * `['games', gameId]` (Spieldokument) und `['games', gameId, 'player', playerId]`
 * (Spieler-Dokument) - path[1] ist in beiden Fällen die (lokale) gameId.
 */
@Injectable({
  providedIn: 'root',
})
export class LocalGameDocumentStoreService {
  constructor(private saves: LocalSingleplayerSaveService) {}

  getDoc<T extends DocumentData>(path: string[]): T | undefined {
    const save = this.saves.getSave(path[1]);
    if (!save) return undefined;
    return (path.length === 2 ? save.game : save.player) as unknown as T;
  }

  setDoc<T extends object>(path: string[], data: T): void {
    const gameId = path[1];
    const existing = this.saves.getSave(gameId);
    const updated = {
      saveId: gameId,
      updatedAt: Date.now(),
      game: (path.length === 2 ? data : existing?.game) as Game,
      player: (path.length === 2 ? existing?.player ?? {} : data) as LocalSingleplayerSavePlayer,
    };
    existing ? this.saves.updateSave(gameId, updated) : this.saves.createSave(updated);
  }

  updateFields<T extends object>(path: string[], patch: Partial<T>): void {
    const current = this.getDoc(path) ?? {};
    this.setDoc(path, { ...current, ...patch });
  }

  /** Issue #87: bildet FirestoreRepositoryService.queryAll() für die player-Subcollection nach
   * (`['games', gameId, 'player']`) - ein lokaler Spielstand hat nie mehr als einen Spieler
   * (`LocalSingleplayerSave.player` ist ein einzelnes Objekt, keine Map), daher genügt
   * `getDoc()` auf den zweisegmentigen Pfad, in ein Array gepackt. Leeres Array, solange kein
   * Save existiert oder dessen Player-Dokument noch nie geschrieben wurde (siehe
   * LocalSingleplayerSaveService.createSave() - `player` startet als `{}`). */
  queryAll<T extends DocumentData>(path: string[]): T[] {
    const player = this.saves.getSave(path[1])?.player;
    return player && Object.keys(player).length > 0 ? [player as unknown as T] : [];
  }
}
