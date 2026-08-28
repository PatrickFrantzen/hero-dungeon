import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { NgxsModule } from '@ngxs/store';
import { ensureAngularFireSchedulersInitialized, ensureFirebaseTestAppInitialized } from 'src/testing/firebase-test-app';

import { GameComponent } from './game.component';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;

  beforeEach(async () => {
    ensureFirebaseTestAppInitialized();

    await TestBed.configureTestingModule({
      declarations: [ GameComponent ],
      imports: [ MatDialogModule, NgxsModule.forRoot([]) ],
      schemas: [ NO_ERRORS_SCHEMA ],
    })
    .compileComponents();

    ensureAngularFireSchedulersInitialized();
    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
