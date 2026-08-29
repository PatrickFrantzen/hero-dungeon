import { Injectable, inject } from '@angular/core';
import {
  DocumentData,
  Firestore,
  QueryConstraint,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';

export class FirestoreOperationError extends Error {
  constructor(
    public readonly operation: string,
    public readonly path: string[],
    public override readonly cause: unknown
  ) {
    super(
      `Firestore-Operation '${operation}' fehlgeschlagen für Pfad '${path.join('/')}': ${
        cause instanceof Error ? cause.message : String(cause)
      }`
    );
    this.name = 'FirestoreOperationError';
  }
}

/**
 * Zentraler Zugriffspunkt auf Firestore: injiziert `Firestore` statt `getFirestore()` selbst
 * aufzurufen, und bildet Firestore-Fehler auf `FirestoreOperationError` ab statt rohe
 * `FirebaseError`s durchzureichen.
 */
@Injectable({
  providedIn: 'root',
})
export class FirestoreRepositoryService {
  private firestore = inject(Firestore);

  async getDoc<T extends DocumentData>(path: string[]): Promise<T | undefined> {
    try {
      const snap = await getDoc(doc(this.firestore, path.join('/')));
      return snap.data() as T | undefined;
    } catch (cause) {
      throw new FirestoreOperationError('getDoc', path, cause);
    }
  }

  async setDoc<T extends object>(path: string[], data: T): Promise<void> {
    try {
      await setDoc(doc(this.firestore, path.join('/')), data);
    } catch (cause) {
      throw new FirestoreOperationError('setDoc', path, cause);
    }
  }

  async updateFields<T extends object>(path: string[], update: Partial<T>): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, path.join('/')), update as DocumentData);
    } catch (cause) {
      throw new FirestoreOperationError('updateFields', path, cause);
    }
  }

  async queryLatest<T extends DocumentData>(
    collectionPath: string[],
    field: string,
    value: unknown
  ): Promise<T | undefined> {
    try {
      const q = query(collection(this.firestore, collectionPath.join('/')), where(field, '==', value));
      const snap = await getDocs(q);
      return snap.docs[snap.docs.length - 1]?.data() as T | undefined;
    } catch (cause) {
      throw new FirestoreOperationError('queryLatest', collectionPath, cause);
    }
  }

  async queryAll<T extends DocumentData>(collectionPath: string[], constraints: QueryConstraint[]): Promise<T[]> {
    try {
      const q = query(collection(this.firestore, collectionPath.join('/')), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => docSnap.data() as T);
    } catch (cause) {
      throw new FirestoreOperationError('queryAll', collectionPath, cause);
    }
  }
}
