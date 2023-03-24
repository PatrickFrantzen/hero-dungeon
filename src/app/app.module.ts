import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from '../environments/environment';
import { FirestoreModule, getFirestore, provideFirestore } from '@angular/fire/firestore';
import { list } from '@angular/fire/database';
import { provideAuth,getAuth } from '@angular/fire/auth';

import { MatDialogModule } from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogGameSettings } from './components/dialog-game-settings/dialog-game-settings.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import { GameComponent } from './components/game/game.component';
import { StartscreenComponent } from './components/startscreen/startscreen.component';

import { SignupComponent } from './components/signup/signup.component';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import { SigninComponent } from './components/signin/signin.component';
import { DialogChooseHeroComponent } from './components/dialog-choose-hero/dialog-choose-hero.component';
import { enableIndexedDbPersistence, Firestore } from '@angular/fire/firestore/firebase';


@NgModule({
  declarations: [
    AppComponent,
    DialogGameSettings,
    GameComponent,
    StartscreenComponent,
    SignupComponent,
    SigninComponent,
    DialogChooseHeroComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    AngularFireModule.initializeApp(environment.firebase),
    provideFirestore(() => {
      const firestore = getFirestore();
      return firestore;
  }),
    provideAuth(() => getAuth()),
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    AngularFireModule,
    FirestoreModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
  ],
  providers: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }


