import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Auth } from '@angular/fire/auth';
import { ensureFirebaseTestAppInitialized } from 'src/testing/firebase-test-app';

import { SignupComponent } from './signup.component';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;

  beforeEach(async () => {
    ensureFirebaseTestAppInitialized();

    await TestBed.configureTestingModule({
      declarations: [ SignupComponent ],
      imports: [ ReactiveFormsModule, RouterTestingModule ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        { provide: Auth, useValue: {} },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
