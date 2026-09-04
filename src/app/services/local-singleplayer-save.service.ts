import { Injectable } from '@angular/core';
import { Game } from 'src/models/game';

export interface LocalSingleplayerSavePlayer {
  playerId: string;
  choosenHero: unknown;
  handstack: string[];
  cardstack: string[];
  deliveryStack: string[];
}

export interface LocalSingleplayerSave {
  saveId: string;
  updatedAt: number;
  game: Game;
  player: LocalSingleplayerSavePlayer;
}

/**
 * CRUD für lokale Singleplayer-Spielstände (LocalStorage) - Persistenz-Unterbau für
 * `docs/planned/login-multiplayer-onboarding-plan.md` PR 1. Kein Firestore-Zugriff.
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
}
