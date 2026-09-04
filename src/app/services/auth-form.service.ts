import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  signInAnonymously,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { User } from 'src/models/user.class';
import { FirestoreRepositoryService } from './firestore-repository.service';

type AuthFormKind = 'login' | 'register' | 'anonymous' | 'link';

// Firebase-Error-Codes, die eine verständlichere Meldung verdienen als die generische
// Kind-Fallback-Meldung unten. Nicht jeder mögliche Auth-Error-Code ist hier aufgeführt -
// nur die, die im Alltag tatsächlich auftreten (falsches Passwort, doppelte E-Mail, ...).
const AUTH_ERROR_MESSAGES: Partial<Record<string, string>> = {
  'auth/wrong-password': 'Login fehlgeschlagen: E-Mail oder Passwort ist falsch.',
  'auth/user-not-found': 'Login fehlgeschlagen: E-Mail oder Passwort ist falsch.',
  'auth/invalid-credential': 'Login fehlgeschlagen: E-Mail oder Passwort ist falsch.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte kurz warten und erneut versuchen.',
  'auth/email-already-in-use': 'Registrierung fehlgeschlagen: Diese E-Mail-Adresse wird bereits verwendet.',
  'auth/weak-password': 'Registrierung fehlgeschlagen: Das Passwort ist zu schwach (mindestens 6 Zeichen).',
};

const DEFAULT_MESSAGES: Record<AuthFormKind, string> = {
  login: 'Login fehlgeschlagen: E-Mail oder Passwort ist falsch.',
  register: 'Registrierung fehlgeschlagen. Bitte prüfe deine Eingaben und versuche es erneut.',
  anonymous: 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
  link: 'Verknüpfung fehlgeschlagen. Bitte prüfe deine Eingaben und versuche es erneut.',
};

function mapAuthError(error: unknown, kind: AuthFormKind): string {
  const code = (error as { code?: string } | undefined)?.code;
  return (code && AUTH_ERROR_MESSAGES[code]) || DEFAULT_MESSAGES[kind];
}

/**
 * Kapselt den Firebase-Auth-Call + Fehler-Mapping für Signin/Signup an einer Stelle, statt es
 * potenziell zweimal (und mit der Zeit auseinanderdriftend) in beiden Komponenten zu
 * duplizieren. Wirft ein Error mit einer bereits UI-tauglichen deutschen Meldung - die
 * Komponenten müssen keine Firebase-Error-Codes kennen.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthFormService {
  private auth = inject(Auth);
  private repo = inject(FirestoreRepositoryService);

  async login(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      throw new Error(mapAuthError(error, 'login'));
    }
  }

  async register(email: string, password: string, nickname: string): Promise<void> {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = new User();
      user.userEmail = email;
      user.userId = credential.user.uid;
      user.userNickname = nickname;
      await this.repo.setDoc(['users', credential.user.uid], user.toJSON());
    } catch (error) {
      throw new Error(mapAuthError(error, 'register'));
    }
  }

  /**
   * Multiplayer-Einstieg ohne Formular (Issue #76): `StartscreenComponent.newGame()`/
   * `joinGame()` rufen das vor dem eigentlichen Firestore-Zugriff auf. Kein Aufruf, wenn schon
   * ein Nutzer eingeloggt ist (anonym oder registriert) - Singleplayer/Tutorial brauchen diesen
   * Aufruf laut Plan nie.
   */
  async ensureAnonymousSession(): Promise<void> {
    if (this.auth.currentUser) {
      return;
    }
    try {
      await signInAnonymously(this.auth);
    } catch (error) {
      throw new Error(mapAuthError(error, 'anonymous'));
    }
  }

  /**
   * Verknüpft den bereits anonym eingeloggten Nutzer (aus ensureAnonymousSession()) mit
   * E-Mail/Passwort (Issue #78) - gleiche `uid` wie zuvor, im Unterschied zu register() (Issue
   * #75, PR 3) entsteht hier KEINE neue uid und damit auch kein Migrationsschritt. Ein
   * Fehlschlag (z.B. E-Mail bereits vergeben) invalidiert den bestehenden anonymen Account
   * NICHT - linkWithCredential() meldet den Nutzer bei einem Fehler nicht ab, und dieser Code
   * ruft im catch-Zweig bewusst kein signOut() o.ä. auf.
   */
  async linkAnonymousAccount(email: string, password: string, nickname: string): Promise<void> {
    try {
      const credential = EmailAuthProvider.credential(email, password);
      const linked = await linkWithCredential(this.auth.currentUser!, credential);
      await this.repo.setDocMerge(['users', linked.user.uid], { userEmail: email, userNickname: nickname });
    } catch (error) {
      throw new Error(mapAuthError(error, 'link'));
    }
  }
}
