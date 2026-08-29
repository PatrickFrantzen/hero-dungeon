import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideStore } from '@ngxs/store';
import { withNgxsStoragePlugin } from '@ngxs/storage-plugin';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { cardsInHandState } from './states/cardsInHand-state';
import { CardStackState } from './states/cardStack-state';
import { CurrentGameState } from './states/currentGame-state';
import { CurrentUserState } from './states/currentUser-state';
import { DeliveryStackState } from './states/deliveryStack-state';
import { EncounterState } from './states/encounter-state';
import { heropowerState } from './states/heropower-state';
import { LobbyState } from './states/lobby-state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(routes),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStore(
      [cardsInHandState, CardStackState, CurrentGameState, CurrentUserState, DeliveryStackState, heropowerState, LobbyState, EncounterState],
      { developmentMode: !environment.production },
      withNgxsStoragePlugin({ keys: '*' }),
    ),
  ],
};
