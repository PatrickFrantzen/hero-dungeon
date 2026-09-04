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

  describe('ensureAnonymousSession()', () => {
    it('does nothing when a user is already signed in', async () => {
      const auth = TestBed.inject(Auth) as unknown as { currentUser: unknown };
      auth.currentUser = { uid: 'already-signed-in' };

      await expectAsync(service.ensureAnonymousSession()).toBeResolved();
    });

    it('attempts an anonymous sign-in when no user is signed in yet', async () => {
      const auth = TestBed.inject(Auth) as unknown as { currentUser: unknown };
      auth.currentUser = null;

      // Der Test-Auth-Provider (Auth = {}) hat keine echte Firebase-Verbindung - der Aufruf
      // schlägt daher fehl, beweist aber, dass tatsächlich ein Anonymous-Sign-in-Versuch
      // unternommen wird (statt wie im Fall oben früh zurückzukehren).
      await expectAsync(service.ensureAnonymousSession()).toBeRejected();
    });
  });

  describe('linkAnonymousAccount()', () => {
    it('maps a failed link attempt to a German message, without invalidating the existing anonymous session', async () => {
      const auth = TestBed.inject(Auth) as unknown as { currentUser: unknown };
      const anonymousUser = { uid: 'anon-uid' };
      auth.currentUser = anonymousUser;

      // Der Test-Auth-Provider (Auth = {}) hat keine echte Firebase-Verbindung - linkWithCredential()
      // schlägt daher fehl (analog zu den ensureAnonymousSession()/login()-Tests oben), beweist
      // aber, dass tatsächlich ein Verknüpfungsversuch unternommen wird.
      await expectAsync(service.linkAnonymousAccount('alice@example.com', 'secret123', 'Alice')).toBeRejectedWithError(
        /Verkn/
      );

      // Firebase meldet bei einem fehlgeschlagenen linkWithCredential() den bestehenden
      // anonymen Nutzer nicht ab - dieser Test würde brechen, sollte künftiger Code das doch
      // tun (z.B. ein versehentliches signOut() im catch-Zweig).
      expect(auth.currentUser).toBe(anonymousUser);
    });
  });
});
