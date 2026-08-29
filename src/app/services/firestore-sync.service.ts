import { Injectable, inject } from '@angular/core';
import { DocumentData, Firestore, collection, collectionData, onSnapshot, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FirestoreOperationError } from './firestore-repository.service';

/**
 * Kapselt die beiden Live-Subscriptions, die PlayerHandComponent für den Spielzustand
 * braucht: "irgendetwas in der games-Collection hat sich geändert" (Trigger, um das aktuelle
 * Spieldokument neu zu laden) und "das eigene Spieler-Dokument hat sich geändert". Reine
 * Firestore-Zugriffslogik - welche NGXS-Actions daraus dispatcht werden, bleibt in der
 * Komponente.
 */
@Injectable({
  providedIn: 'root',
})
export class FirestoreSyncService {
  private firestore = inject(Firestore);

  watchGamesCollection(): Observable<DocumentData[]> {
    return collectionData(collection(this.firestore, 'games'));
  }

  /**
   * Liefert jedes Dokument, das auf `userId == playerId` im `games/{gameId}/player`-
   * Subcollection passt (wie die Vorlage: erwartet genau ein Dokument, iteriert aber wie das
   * Original über den ganzen Snapshot). Ein `onSnapshot`-Fehler (z.B. Verbindungsabbruch) wird
   * als `FirestoreOperationError` auf dem Observable-Error-Kanal gemeldet statt verschluckt zu
   * werden.
   */
  watchPlayerDoc(gameId: string, playerId: string): Observable<DocumentData> {
    const path = ['games', gameId, 'player'];
    return new Observable<DocumentData>((subscriber) => {
      const playerQuery = query(collection(this.firestore, path.join('/')), where('userId', '==', playerId));
      const unsubscribe = onSnapshot(
        playerQuery,
        (snapshot) => {
          snapshot.forEach((docSnap) => subscriber.next(docSnap.data()));
        },
        (cause) => {
          subscriber.error(new FirestoreOperationError('onSnapshot', path, cause));
        }
      );
      return unsubscribe;
    });
  }
}
