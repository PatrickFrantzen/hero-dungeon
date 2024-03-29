import { BlockScrollStrategy } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import { getFirestore, doc, getDoc } from '@angular/fire/firestore';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CurrentGameService {


  db: any;
  

  constructor() { }

  public async getCurrentGame(gameId: string) {
    const firebaseApp = initializeApp(environment.firebase);
    this.db = getFirestore(firebaseApp);
    const docRef = doc(this.db, 'games', gameId);
    const docSnap = await getDoc(docRef);
    const currentGameData = docSnap.data();
    return currentGameData;
  }

}
