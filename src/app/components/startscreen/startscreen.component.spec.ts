import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { Auth } from '@angular/fire/auth';
import { NgxsModule } from '@ngxs/store';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { environment } from 'src/environments/environment';

import { StartscreenComponent } from './startscreen.component';

describe('StartscreenComponent', () => {
  let component: StartscreenComponent;
  let fixture: ComponentFixture<StartscreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StartscreenComponent ],
      imports: [
        RouterTestingModule,
        MatDialogModule,
        NgxsModule.forRoot([]),
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => getFirestore()),
      ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: Auth, useValue: {} },
      ],
    })
    .compileComponents();

    TestBed.inject(ɵAngularFireSchedulers);
    fixture = TestBed.createComponent(StartscreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
