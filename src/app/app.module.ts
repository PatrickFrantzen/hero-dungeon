import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import {  getFirestore, provideFirestore } from '@angular/fire/firestore';
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
import { PlayerHandComponent } from './components/player-hand/player-hand.component';
import { CurrentGameService } from './services/current-game.service';
import { CurrentUserService } from './services/current-user.service';
import { EnemyComponent } from './components/enemy/enemy.component';
import { NgxsModule } from '@ngxs/store';
import { cardsInHandState } from './states/cardsInHand-state';
import { CardStackState } from './states/cardStack-state';
import { CurrentGameState } from './states/currentGame-state';
import { CurrentUserState } from './states/currentUser-state';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { CurrentDeliveryStack } from './actions/deliveryStack-action';
import { DeliveryStackState } from './states/deliveryStack-state';
import { HeropowerComponent } from './components/heropower/heropower.component';
import { heropowerState } from './states/heropower-state';


@NgModule({
  declarations: [
    AppComponent,
    DialogGameSettings,
    GameComponent,
    StartscreenComponent,
    SignupComponent,
    SigninComponent,
    DialogChooseHeroComponent,
    PlayerHandComponent,
    EnemyComponent,
    HeropowerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    NgxsModule.forRoot([cardsInHandState, CardStackState, CurrentGameState, CurrentUserState, DeliveryStackState, heropowerState], {developmentMode: !environment.production}),
    NgxsStoragePluginModule.forRoot(),
  ],
  providers: [CurrentGameService, CurrentUserService, ],
  bootstrap: [AppComponent]
})
export class AppModule { }


