import { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ɵAngularFireSchedulers } from '@angular/fire';
import { initializeApp as initializeAngularFireApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { environment } from 'src/environments/environment';

/**
 * Every service/component in this codebase calls `getFirestore()`/`getAuth()` directly
 * (no constructor-injected Firestore/Auth), which resolves against Firebase's global default
 * app rather than Angular's DI tree. TestBed's per-test teardown (stricter since Angular 16)
 * tears down `@angular/fire`'s DI-registered app between tests, so relying on
 * `provideFirebaseApp()` alone is order-dependent - a test can pass or fail depending on which
 * spec ran immediately before it in the shared Karma browser page.
 *
 * Call this before creating the component/service under test in any spec that (transitively)
 * calls `getFirestore()`/`getAuth()`.
 */
export function ensureFirebaseTestAppInitialized(): void {
  if (!getApps().length) {
    initializeApp(environment.firebase);
  }
}

/**
 * `@angular/fire`'s wrapped SDK functions (e.g. `getFirestore()` from `@angular/fire/firestore`)
 * read a module-global scheduler set the first time `ɵAngularFireSchedulers` is constructed
 * anywhere on the page - not per TestBed injector. Call this once, after
 * `TestBed.configureTestingModule(...)`, in any spec that (transitively) calls an
 * `@angular/fire`-wrapped Firebase function; otherwise it throws "AngularFireModule has not
 * been provided" depending on which spec happened to construct it first.
 */
export function ensureAngularFireSchedulersInitialized(): void {
  TestBed.inject(ɵAngularFireSchedulers);
}

/**
 * Providers for any spec whose service under test injects `Firestore` via DI (`inject(Firestore)`
 * or a constructor parameter) instead of calling `getFirestore()` itself - mirrors the
 * `provideFirebaseApp()`/`provideFirestore()` registration in `app.config.ts`.
 */
export function firestoreTestProviders(): (Provider | EnvironmentProviders)[] {
  return [
    provideFirebaseApp(() => initializeAngularFireApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
  ];
}
