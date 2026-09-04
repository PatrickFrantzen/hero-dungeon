/** Lokale Singleplayer-Spielstände bekommen eine gameId mit diesem Präfix (vergeben beim
 * Anlegen, siehe LocalSingleplayerSaveService) - daran erkennt FirestoreRepositoryService, ob
 * ein Pfad lokal (LocalGameDocumentStoreService) oder über Firestore bedient wird. */
export const LOCAL_GAME_ID_PREFIX = 'local-';

export function isLocalGameId(gameId: string): boolean {
  return gameId.startsWith(LOCAL_GAME_ID_PREFIX);
}
