import { inject, Injectable } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { doc, getDoc, Firestore, DocumentData } from '@angular/fire/firestore';
import { Store } from '@ngxs/store';
import { CurrentUserAction } from '../actions/currentUser-action';

@Injectable({
  providedIn: 'root',
})
export class CurrentUserService {
  private store = inject(Store);
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  currentUser = '';
  currentUserId = '';
  currentUserHero: object = {};
  currentUserData: DocumentData | undefined;

  public getCurrentUser(): Promise<DocumentData | undefined> {
    return new Promise((resolve) => {
      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          const docRef = doc(this.firestore, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          this.currentUserData = docSnap.data();
          // Nutzerdokument fehlt (z.B. Race Condition beim Registrieren) - auf die
          // Firebase-Auth-UID zurückfallen statt eine TypeError bei fehlendem Dokument zu
          // riskieren.
          this.currentUser = this.currentUserData?.['userNickname'] ?? 'Gast';
          this.currentUserId = this.currentUserData?.['userId'] ?? user.uid;
          this.store.dispatch(
            new CurrentUserAction(this.currentUserId, this.currentUser),
          );
        } else {
          this.currentUser = 'Gast';
        }
        resolve(this.currentUserData);
      });
    });
  }
}
