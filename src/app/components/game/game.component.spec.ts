import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { NgxsModule, Store } from '@ngxs/store';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { CardStackState } from 'src/app/states/cardStack-state';
import { cardsInHandState } from 'src/app/states/cardsInHand-state';
import { DeliveryStackState } from 'src/app/states/deliveryStack-state';
import { CurrentUserState } from 'src/app/states/currentUser-state';
import { EncounterState } from 'src/app/states/encounter-state';
import { heropowerState } from 'src/app/states/heropower-state';
import { LobbyState } from 'src/app/states/lobby-state';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { GameComponent } from './game.component';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let store: Store;

  beforeEach(async () => {
    ensureFirebaseTestAppInitialized();

    await TestBed.configureTestingModule({
    imports: [MatDialogModule, NgxsModule.forRoot([CurrentGameState, CurrentUserState, heropowerState, CardStackState, cardsInHandState, DeliveryStackState, LobbyState, EncounterState]), GameComponent],
    providers: firestoreTestProviders(),
    schemas: [NO_ERRORS_SCHEMA],
})
    .compileComponents();

    ensureAngularFireSchedulersInitialized();

    // GameComponent.ngOnInit reads the current game id from the store synchronously and
    // builds a Firestore document path from it - an empty id (the state's default) makes
    // doc() throw synchronously ("Invalid document reference"). Seed a non-empty id so the
    // path is valid; see Issue #8 for untangling GameComponent's Firestore access from its
    // lifecycle.
    store = TestBed.inject(Store);
    const snapshot = store.snapshot();
    store.reset({ ...snapshot, currentGame: { ...snapshot['currentGame'], items: 'test-game-id' } });

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the full five-minute countdown before the first card is played', () => {
    expect(component.formattedRemainingTime()).toBe('05:00');
  });

  it('formats the remaining countdown from the stored timer start', () => {
    const now = Date.now();
    const snapshot = store.snapshot();
    store.reset({
      ...snapshot,
      currentGame: {
        ...snapshot['currentGame'],
        timerStartedAt: now - 125_000,
        timerDurationSeconds: 300,
      },
    });
    component.now.set(now);

    expect(component.formattedRemainingTime()).toBe('02:55');
  });

  afterEach(() => {
    fixture.destroy();
  });
});
