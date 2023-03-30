import { Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import { getAuth, onAuthStateChanged } from '@angular/fire/auth';
import { getFirestore, doc, getDoc, Firestore, DocumentData } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {

  currentUser:string = '';
  currentUserId: string = '';
  currentUserHero: Object = {};
  currentUserData: DocumentData | undefined;

  constructor(
  ) {

   }
   
  public getCurrentUser():Promise<any> {
    const firebaseApp = initializeApp(environment.firebase)
    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);
    return new Promise((resolve, reject)=> {
      onAuthStateChanged(auth,  async (user) => {
        if (user) {
          const uid = user.uid;
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          this.currentUserData = docSnap.data();
          this.currentUser = this.currentUserData!['userNickname'];
          this.currentUserId = this.currentUserData!['userId'];
          this.currentUserHero = this.currentUserData!['choosenHero'];
        } else {
          this.currentUser = 'Gast'
          
        }
        resolve(this.currentUserData)
      })
    })
  }
}
