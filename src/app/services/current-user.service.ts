import { Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {

  currentUser:string = '';
  currentUserId: string = '';
  currentUserHero: Object = {};
  

  constructor(
  ) { }

  public getCurrentUser() {
    const firebaseApp = initializeApp(environment.firebase)
    const auth = getAuth(firebaseApp);
    const db = getFirestore();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        const currentUserData = docSnap.data();
        this.currentUser = currentUserData!['userNickname'];
        this.currentUserId = currentUserData!['userId'];
        this.currentUserHero = currentUserData!['choosenHero'];
      } else {
        this.currentUser = 'Gast'
      }
    })
  }

}
