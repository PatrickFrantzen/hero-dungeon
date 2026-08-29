import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { NgxsModule } from '@ngxs/store';
import { CurrentGameState } from 'src/app/states/currentGame-state';
import { CardStackState } from 'src/app/states/cardStack-state';
import { cardsInHandState } from 'src/app/states/cardsInHand-state';
import { DeliveryStackState } from 'src/app/states/deliveryStack-state';
import { CurrentUserState } from 'src/app/states/currentUser-state';
import { heropowerState } from 'src/app/states/heropower-state';
import { ensureAngularFireSchedulersInitialized, ensureFirebaseTestAppInitialized } from 'src/testing/firebase-test-app';

import { PlayerHandComponent } from './player-hand.component';

describe('PlayerHandComponent', () => {
  let component: PlayerHandComponent;
  let fixture: ComponentFixture<PlayerHandComponent>;

  beforeEach(async () => {
    ensureFirebaseTestAppInitialized();

    await TestBed.configureTestingModule({
    imports: [MatDialogModule, NgxsModule.forRoot([CurrentGameState, CurrentUserState, heropowerState, CardStackState, cardsInHandState, DeliveryStackState]), PlayerHandComponent],
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
});
