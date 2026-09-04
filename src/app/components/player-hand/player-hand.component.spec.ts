import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { NgxsModule, Store } from '@ngxs/store';
import { CurrentGameAction } from 'src/app/actions/currentGame-action';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { CardStackState } from 'src/app/states/cardStack-state';
import { cardsInHandState } from 'src/app/states/cardsInHand-state';
import { DeliveryStackState } from 'src/app/states/deliveryStack-state';
import { CurrentUserState } from 'src/app/states/currentUser-state';
import { EncounterState } from 'src/app/states/encounter-state';
import { EncounterSelectors } from 'src/app/selectors/encounter-selector';
import { CurrentHandSelector } from 'src/app/selectors/currentHand-selector';
import { heropowerState } from 'src/app/states/heropower-state';
import { JokerSelectionState } from 'src/app/states/joker-selection-state';
import { LobbyState } from 'src/app/states/lobby-state';
import { Game } from 'src/models/game';
import { LocalSingleplayerSaveService } from 'src/app/services/local-singleplayer-save.service';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { PlayerHandComponent } from './player-hand.component';

describe('PlayerHandComponent', () => {
  let component: PlayerHandComponent;
  let fixture: ComponentFixture<PlayerHandComponent>;

  beforeEach(async () => {
    ensureFirebaseTestAppInitialized();

    await TestBed.configureTestingModule({
    imports: [MatDialogModule, NgxsModule.forRoot([CurrentGameState, CurrentUserState, heropowerState, JokerSelectionState, CardStackState, cardsInHandState, DeliveryStackState, LobbyState, EncounterState]), PlayerHandComponent],
    providers: firestoreTestProviders(),
    schemas: [NO_ERRORS_SCHEMA],
})
    .compileComponents();

    ensureAngularFireSchedulersInitialized();
    fixture = TestBed.createComponent(PlayerHandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not subscribe to Firestore sync for a local- game (no network access needed for solo)', () => {
    TestBed.inject(Store).dispatch(new CurrentGameAction('local-1'));
    const localFixture = TestBed.createComponent(PlayerHandComponent);

    localFixture.detectChanges();

    expect(localFixture.componentInstance.gameSubscr).toBeUndefined();
  });

  it('loads a resumed local save into the store once, without a live subscription', fakeAsync(() => {
    // fakeAsync/tick statt whenStable(): whenStable() wartet auf die komplette Zone, inkl. des
    // in beforeEach oben bereits erzeugten Firestore-Listeners der Nicht-lokal-Fixture (der bei
    // einem echten Firebase-Projekt ohne Emulator nie "stable" wird) - tick() spult dagegen nur
    // die für diesen Test relevanten Microtasks vor.
    localStorage.clear();
    const currentEnemy = { name: 'Baby-Barbar', type: 'Boss', token: ['red'] };
    TestBed.inject(LocalSingleplayerSaveService).createSave({
      saveId: 'local-2',
      updatedAt: Date.now(),
      game: { currentEnemy, Mob: [], choosenHeros: [], gameStatus: 'playing' } as unknown as Game,
      player: { userId: '', handstack: ['blue'], cardstack: [], deliveryStack: [] },
    });
    TestBed.inject(Store).dispatch(new CurrentGameAction('local-2'));

    const localFixture = TestBed.createComponent(PlayerHandComponent);
    localFixture.detectChanges();
    tick();

    const store = TestBed.inject(Store);
    expect(store.selectSnapshot(EncounterSelectors.currentEnemy)).toEqual(currentEnemy);
    expect(store.selectSnapshot(CurrentHandSelector.currentHand)).toEqual(['blue']);
    localStorage.clear();
  }));
});
