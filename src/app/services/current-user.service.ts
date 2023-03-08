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
  db = getFirestore();

  constructor(
  ) { }

  public getCurrentUser() {
    //const app = initializeApp(environment);
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        const docRef = doc(this.db, 'users', user.uid);
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
