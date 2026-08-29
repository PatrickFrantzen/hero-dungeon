import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { Auth } from '@angular/fire/auth';
import { NgxsModule } from '@ngxs/store';
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
});
