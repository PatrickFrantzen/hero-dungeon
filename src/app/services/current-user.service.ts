import { Injectable } from '@angular/core';
import { getAuth, onAuthStateChanged } from "firebase/auth";

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {

  currentUser:string = '';

  constructor(
  ) { }

  public getCurrentUser() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        
      } else {
        this.currentUser = 'Gast'
      }

    })
  }

}
