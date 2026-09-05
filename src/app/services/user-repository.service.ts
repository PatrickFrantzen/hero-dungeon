import { Injectable } from '@angular/core';
import { DocumentData, serverTimestamp } from '@angular/fire/firestore';
import { FirestoreRepositoryService } from './firestore-repository.service';

/** Ein Eintrag in `users/{uid}.games` ("Meine Spiele", Issue #78). `lastPlayedAt` fehlt bei
 * Einträgen, die vor der Umstellung von `string[]` auf dieses Objektformat (2026-09-05, für den
 * Spielstand-Auswahldialog) geschrieben wurden - `normalizeJoinedGames()` füllt das mit `0`
 * auf, damit ein Aufrufer nicht zwischen altem/neuem Format unterscheiden muss. */
export interface JoinedGame {
  gameId: string;
  lastPlayedAt: number;
}

/** Migriert das alte `string[]`-Format (nur gameId) verlustfrei in das neue Objektformat - ein
 * Bestandsnutzer hat u.U. noch Einträge im alten Format in Firestore liegen, bis er das nächste
 * Mal einem Spiel beitritt (addJoinedGame() unten schreibt danach immer das neue Format). */
function normalizeJoinedGames(raw: unknown): JoinedGame[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((entry) => (typeof entry === 'string' ? { gameId: entry, lastPlayedAt: 0 } : (entry as JoinedGame)));
}

/**
 * Alle Firestore-Zugriffe auf das `users/{uid}`-Profil-Dokument (Nickname/E-Mail,
 * Multiplayer-Spielhistorie). Getrennt von GameRepositoryService/PlayerRepositoryService, da
 * `users/{uid}` fachlich zum Account gehört, nicht zu einem einzelnen Spiel.
 */
@Injectable({
  providedIn: 'root',
})
export class UserRepositoryService {
  constructor(private repo: FirestoreRepositoryService) {}

  getUser(uid: string): Promise<DocumentData | undefined> {
    return this.repo.getDoc(['users', uid]);
  }

  /** "Meine Spiele" normalisiert gelesen (siehe `JoinedGame`/`normalizeJoinedGames()` oben) -
   * bevorzugt gegenüber `getUser()` + eigener Normalisierung an jeder Aufrufstelle. */
  async getJoinedGames(uid: string): Promise<JoinedGame[]> {
    const data = await this.getUser(uid);
    return normalizeJoinedGames(data?.['games']);
  }

  /**
   * "Meine Spiele" (Issue #78): merkt sich eine beigetretene/erstellte Multiplayer-gameId im
   * Profil-Dokument, inkl. Zeitpunkt (Spielstand-Auswahldialog, 2026-09-05, "zuletzt gespielt").
   * Anonyme Nutzer haben zu diesem Zeitpunkt noch kein `users/{uid}`-Dokument (das entsteht
   * bislang nur bei AuthFormService.register()) - `setDocMerge()` legt es bei Bedarf an.
   * Liest-modifiziert-schreibt das komplette Array statt `arrayUnion()`, da `lastPlayedAt` bei
   * jedem erneuten Beitritt aktualisiert werden muss (arrayUnion dedupliziert nur exakt gleiche
   * Werte) - bei echtem gleichzeitigem Schreiben zweier Clients ist ein Lost-Update theoretisch
   * möglich, wie bei den übrigen Read-Modify-Write-Stellen in diesem Modul auch (siehe
   * services/CLAUDE.md, `addPlayerToGame()`).
   */
  async addJoinedGame(uid: string, gameId: string): Promise<void> {
    const games = await this.getJoinedGames(uid);
    const updatedGames = [...games.filter((game) => game.gameId !== gameId), { gameId, lastPlayedAt: Date.now() }];

    return this.repo.setDocMerge(['users', uid], {
      games: updatedGames,
      lastActivityAt: serverTimestamp(),
    });
  }
}
