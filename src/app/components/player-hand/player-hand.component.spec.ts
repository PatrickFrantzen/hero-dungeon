import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { NgxsModule } from '@ngxs/store';
import { ensureAngularFireSchedulersInitialized, ensureFirebaseTestAppInitialized } from 'src/testing/firebase-test-app';

import { PlayerHandComponent } from './player-hand.component';

describe('PlayerHandComponent', () => {
  let component: PlayerHandComponent;
  let fixture: ComponentFixture<PlayerHandComponent>;

  beforeEach(async () => {
    ensureFirebaseTestAppInitialized();

    await TestBed.configureTestingModule({
      declarations: [ PlayerHandComponent ],
      imports: [ MatDialogModule, NgxsModule.forRoot([]) ],
      schemas: [ NO_ERRORS_SCHEMA ],
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
