# Refactoring-Plan: FirestoreRepositoryService einführen, Services konsolidieren

Kontext: Punkt 3 der „Empfohlenen Reihenfolge" aus
`docs/done/review-2026-08/00-overview.md`, Detailbefunde in
`docs/done/review-2026-08/02-services.md`. PR #21 hat aus diesem Bereich bereits die
risikoarmen Teile erledigt (Duplikate gemergt, toter Code entfernt, Race Condition behoben —
siehe Status-Abschnitt dort). Dieses Dokument ist der Plan für den verbleibenden, größeren
Umbau: eine gemeinsame Firestore-Abstraktion mit Error-Handling, auf die die bestehenden
Services umgestellt werden. Stand der Diagnose: 2026-08-29, nach PR #21.

## Diagnose

**Kein zentraler Zugriffspunkt auf Firestore, jeder Service holt sich seine Instanz selbst:**
- `src/app/app.config.ts:23-24` registriert `Firestore` bereits korrekt über
  `provideFirebaseApp()`/`provideFirestore()` — die DI-Infrastruktur existiert.
- Trotzdem rufen `SaveGameService` (`save-game.service.ts:10`), `LoadGameService`
  (`load-game.service.ts:14`), `GamePlayerService` (`game-player.service.ts:13`) alle
  `getFirestore()` als Feld-Initialisierer auf, statt `Firestore` per Konstruktor/`inject()` zu
  beziehen — funktioniert nur, weil `bootstrapApplication` vorher schon eine Default-App
  angelegt hat (implizite Kopplung an Initialisierungsreihenfolge).
- `CurrentUserService.getCurrentUser()` (`current-user.service.ts:29-32`) ruft sogar bei
  **jedem** Aufruf erneut `initializeApp(environment.firebase)` + `getAuth()`/`getFirestore()`
  auf.
- Drei Komponenten bauen zusätzlich ihre eigene `db`-Instanz statt einen Service zu nutzen:
  `PlayerHandComponent.db` (`player-hand.component.ts:92`), `StartscreenComponent.db`
  (`startscreen.component.ts:30`), `SignupComponent.db` (`signup.component.ts:25`).

**Kein Error-Handling um einen einzigen Firestore-Aufruf:**
- `SaveGameService`s sechs `updateDoc(...)`-Aufrufe (`save-game.service.ts:14-40`) geben zwar
  seit PR #21 das Promise zurück, werden aber an keiner Aufrufstelle awaited/gecatcht (siehe
  `PlayerHandComponent`, praktisch jede Methode ab `player-hand.component.ts:160`).
- `GamePlayerService.createPlayer()` (`game-player.service.ts:25-29`) macht zwei sequenzielle
  Awaits (`setDoc` dann `updateDoc`) ohne Transaktion — schlägt der zweite Call fehl, bleibt ein
  halb angelegtes Player-Dokument zurück.
- `CurrentUserService.getCurrentUser()` (`current-user.service.ts:38-41`) liest
  `docSnap.data()!['userNickname']`/`['userId']` mit Non-null-Assertion auf ein potenziell
  `undefined`-Ergebnis (Dokument existiert nicht) — kein Null-Check, keine fachliche
  Fehlermeldung, nur ein `TypeError` zur Laufzeit.
- `StartscreenComponent.openDialog()` (`startscreen.component.ts:73-80`) und `.joinGame()`
  haben inzwischen (PR #21) Firestore-seitige Fehlerpfade abgefangen, aber weiterhin ohne
  gemeinsame Fehlerklasse/Konvention — jede Komponente erfindet ihr eigenes Fehler-Feld.

**Überlappende Zuständigkeit zwischen den verbleibenden Services:**
- `SaveGameService.updateHandstack`/`updateCardstack` (`save-game.service.ts:13-21`, zwei
  separate `updateDoc`-Aufrufe) und `GamePlayerService.updatePlayerCards`
  (`game-player.service.ts:39-41`, ein Aufruf für beide Felder) schreiben denselben
  Player-Dokumentpfad `games/{gameId}/player/{playerId}` — zwei Services für dieselbe
  Operation, mit unterschiedlicher Roundtrip-Zahl.
- `GamePlayerService.getGame()` (`game-player.service.ts:15-18`) und
  `LoadGameService.loadGameCollectionData()` (`load-game.service.ts:22-27`) lesen im Ergebnis
  dasselbe Dokument (`games/{gameId}`), einmal per `getDoc`, einmal per `query`+`where`.

## TODOs

- [ ] **TODO 1 — `FirestoreRepositoryService` einführen**
  - Neue Datei `src/app/services/firestore-repository.service.ts`, `Firestore` per
    Konstruktor-Injection (nicht `getFirestore()`).
  - Generische Methoden `getDoc<T>(path: string[]): Promise<T | undefined>`,
    `updateFields<T extends object>(path: string[], update: Partial<T>): Promise<void>`,
    `setDoc<T extends object>(path: string[], data: T): Promise<void>`,
    `queryLatest<T>(collectionPath: string[], field: string, value: unknown): Promise<T | undefined>`
    (deckt das `query`+`where`+„letztes Element gewinnt"-Muster aus `LoadGameService` ab).
  - Jede Methode fängt Firestore-Fehler und wirft eine eigene `FirestoreOperationError` (Name,
    betroffener Pfad, Original-Error als `cause`) — ein Fehler-Typ statt roher
    `FirebaseError`s, damit Aufrufer nicht Firebase-SDK-Interna kennen müssen.
  - Verifikation: `ng build`, neuer Unit-Test mit Firestore-Emulator (Muster aus
    `src/testing/firebase-test-app`, bereits importiert in den bestehenden `.spec.ts`-Dateien,
    aber bisher nicht für echte Assertions genutzt) — mindestens „erfolgreicher Read/Write" und
    „Fehler wird als `FirestoreOperationError` geworfen" testen.

- [ ] **TODO 2 — `SaveGameService` auf `FirestoreRepositoryService` umstellen**
  - `updateHandstack`/`updateCardstack`/`updateDeliveryStack`/`updateCurrentEnemyToken`/
    `updateNewMob`/`updateQuestStatus` werden dünne Wrapper um
    `repo.updateFields([...], {...})`.
  - `db = getFirestore()`-Feld entfällt.
  - Verifikation: `ng build`, `ng test` (bestehende `save-game.service.spec.ts` erweitern statt
    nur „should create").

- [ ] **TODO 3 — `LoadGameService`/`GamePlayerService` konsolidieren**
  - Beide Services lesen überlappend `games/{gameId}` bzw. `games/{gameId}/player/{playerId}`
    (siehe Diagnose). Auf zwei klar getrennte Repository-Services pro Aggregat umstellen:
    `GameRepositoryService` (`games/{gameId}`: lesen/schreiben von Gegner, Mob, Quest-Flag,
    Boss, Spielerliste) und `PlayerRepositoryService` (`games/{gameId}/player/{playerId}`:
    Hand-/Kartenstapel, Delivery-Stack, gewählter Held).
  - `GamePlayerService.createPlayer()` (`game-player.service.ts:25-29`) auf eine einzelne
    `setDoc` mit vollständigem Anfangszustand umstellen statt `setDoc` + `updateDoc`
    nacheinander — vermeidet den Halb-angelegt-Zustand aus der Diagnose.
  - Alle Aufrufstellen (`GameComponent`, `StartscreenComponent`, `PlayerHandComponent`) auf die
    neuen Services umstellen; `LoadGameService`/`GamePlayerService`/`SaveGameService` als
    eigenständige Klassen entfernen, sobald nichts mehr auf sie verweist.
  - Verifikation: `ng build`, `ng test`, manueller Smoke-Test (Spiel erstellen, beitreten, Karte
    spielen — dieser Schritt berührt die meistgenutzten Schreibpfade im Spiel).

- [ ] **TODO 4 — `CurrentUserService` auf DI umstellen, Non-null-Assertions entfernen**
  - `initializeApp()`/`getAuth()`/`getFirestore()`-Aufrufe in `getCurrentUser()`
    (`current-user.service.ts:29-32`) durch injizierte `Auth`/`Firestore` ersetzen.
  - `docSnap.data()!['userNickname']`/`['userId']` (`current-user.service.ts:40-41`) durch
    einen Null-Check ersetzen; fehlt das Nutzerdokument, `currentUser`/`currentUserId` auf einen
    definierten Fallback setzen statt eine `TypeError` zu riskieren.
  - Verifikation: `ng build`, `ng test`.

- [ ] **TODO 5 — Aufrufer awaiten Firestore-Writes und zeigen Fehler an**
  - `PlayerHandComponent` (nach TODO 3 auf `GameRepositoryService`/`PlayerRepositoryService`
    umgestellt): die bisher nicht awaiteten `saveGame.update*`-Aufrufe (praktisch jede Methode
    ab `player-hand.component.ts:160`) awaiten und bei einem `FirestoreOperationError` ein
    sichtbares Fehler-Signal setzen (analog zum `errorMessage`/`isSubmitting`-Pattern, das
    Signin/Signup und `StartscreenComponent` in PR #21 bereits bekommen haben).
  - `ngOnInit()`s `onSnapshot`-Callback (`player-hand.component.ts:111-129`) bekommt den
    `error`-Callback von `onSnapshot(query, next, error)` (aktuell nicht übergeben).
  - Dieser TODO ist am ehesten Teil von — oder direkt im Anschluss an —
    `docs/done/player-hand-decomposition-plan.md`s `FirestoreSyncService`-Extraktion; beide
    Pläne fassen dieselbe Datei an derselben Stelle an, deshalb nacheinander abarbeiten, nicht
    parallel in zwei Sessions.
  - Verifikation: `ng build`, `ng test`, manueller Smoke-Test mit absichtlich getrenntem Netz
    (z.B. Firestore-Emulator stoppen während eines Kartenzugs) — Fehler muss sichtbar werden,
    Spiel darf nicht in einem unklaren Zustand hängen bleiben.

## Verifikation (gesamter Plan)

- `ng build` und `ng test --watch=false --browsers=ChromeHeadlessCI` nach jedem TODO grün.
- `npm run test:rules` bleibt unberührt (Repository-Umbau ändert keine Firestore-Datenstruktur
  oder Security Rules).
- Manueller Zwei-Browser-Smoke-Test vor dem Merge von TODO 3 und TODO 5 (echte Firestore-
  Schreibpfade, aktuelle Test-Suite deckt nur „should create" ab).

## Nicht im Scope

- Umstellung von `docSnap.data()`-Zugriffen auf typisierte `FirestoreDataConverter<T>` (Befund
  9 in `docs/done/review-2026-08/02-services.md`) — eigenständiger, unabhängiger
  Typisierungs-Schritt, keine Voraussetzung für die Repository-Konsolidierung.
- Die eigentliche Entflechtung von `PlayerHandComponent` (Firestore-Zugriff ist nur einer von
  vier Verantwortungsbereichen dort) — siehe `docs/done/player-hand-decomposition-plan.md`.

## Referenzen

- `docs/done/review-2026-08/02-services.md` — vollständige Befundliste (Befund 1, 2, 3, 4, 8,
  10 sind hier relevant; 1, 2, teilweise 4 sind in PR #21 bereits erledigt, siehe Status oben).
- `docs/done/onpush-refactor-plan.md` — Referenzstil für Diagnose/TODOs/Verifikation.
- `src/testing/firebase-test-app` — bestehendes Emulator-Test-Setup, bisher nur für
  „should create" genutzt.
