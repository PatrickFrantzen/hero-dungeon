import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import {
  ensureAngularFireSchedulersInitialized,
  ensureFirebaseTestAppInitialized,
  firestoreTestProviders,
} from 'src/testing/firebase-test-app';

import { AuthFormService } from './auth-form.service';

describe('AuthFormService', () => {
  let service: AuthFormService;

  beforeEach(() => {
    ensureFirebaseTestAppInitialized();
    TestBed.configureTestingModule({
      providers: [...firestoreTestProviders(), { provide: Auth, useValue: {} }],
    });
    ensureAngularFireSchedulersInitialized();
    service = TestBed.inject(AuthFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('login() maps a wrong-password error to a German login message', async () => {
    await expectAsync(service.login('user@example.com', 'wrong')).toBeRejectedWithError(
      /Login fehlgeschlagen/
    );
  });
});
