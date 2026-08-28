import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Auth } from '@angular/fire/auth';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { NgxsModule } from '@ngxs/store';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { environment } from 'src/environments/environment';

import { SigninComponent } from './signin.component';

describe('SigninComponent', () => {
  let component: SigninComponent;
  let fixture: ComponentFixture<SigninComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SigninComponent ],
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        NgxsModule.forRoot([]),
        provideFirebaseApp(() => initializeApp(environment.firebase)),
      ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: Auth, useValue: {} },
      ],
    })
    .compileComponents();

    TestBed.inject(ɵAngularFireSchedulers);
    fixture = TestBed.createComponent(SigninComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
