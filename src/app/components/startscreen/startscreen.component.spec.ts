import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Auth } from '@angular/fire/auth';
import { NgxsModule } from '@ngxs/store';
import { of } from 'rxjs';
import { CurrentUserState } from 'src/app/states/currentUser-state';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { StartscreenComponent } from './startscreen.component';

describe('StartscreenComponent', () => {
  let component: StartscreenComponent;
  let fixture: ComponentFixture<StartscreenComponent>;

  beforeEach(async () => {
    ensureFirebaseTestAppInitialized();

    await TestBed.configureTestingModule({
    imports: [RouterTestingModule, MatDialogModule, NgxsModule.forRoot([CurrentUserState]), StartscreenComponent],
    schemas: [NO_ERRORS_SCHEMA],
    providers: [
        { provide: Auth, useValue: {} },
        ...firestoreTestProviders(),
    ],
})
    .compileComponents();

    ensureAngularFireSchedulersInitialized();
    fixture = TestBed.createComponent(StartscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates a newly created singleplayer game to local-game/:id, not game/:id', async () => {
    spyOn(component.dialog, 'open').and.returnValue({
      afterClosed: () => of({ data: { numberOfPlayer: 1, difficulty: 'easy', gameId: 'local-42' } }),
    } as MatDialogRef<unknown>);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.newSingleplayerGame();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/local-game/local-42']);
  });
});
