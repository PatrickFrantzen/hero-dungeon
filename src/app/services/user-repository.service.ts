import { Injectable } from '@angular/core';
import { arrayUnion, DocumentData, serverTimestamp } from '@angular/fire/firestore';
import { FirestoreRepositoryService } from './firestore-repository.service';

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

  /**
   * "Meine Spiele" (Issue #78): merkt sich eine beigetretene/erstellte Multiplayer-gameId im
   * Profil-Dokument. Anonyme Nutzer haben zu diesem Zeitpunkt noch kein `users/{uid}`-Dokument
   * (das entsteht bislang nur bei AuthFormService.register()) - setDocMerge() legt es bei Bedarf
   * an, arrayUnion() verhindert Duplikate bei mehrfachem Beitritt zum selben Spiel.
   */
  addJoinedGame(uid: string, gameId: string): Promise<void> {
    return this.repo.setDocMerge(['users', uid], {
      games: arrayUnion(gameId),
      lastActivityAt: serverTimestamp(),
    });
  }
}
