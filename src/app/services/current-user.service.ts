import { Injectable } from '@angular/core';
import { getAuth, onAuthStateChanged } from "firebase/auth";

@Injectable({
  providedIn: 'root'
})
export class CurrentUserService {


  constructor(
  ) { }

  public getCurrentUser() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        console.log('currentUser', user)
      } else {
        console.log('error')
      }

    })
  }

}
