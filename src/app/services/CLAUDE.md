# src/app/services/ — Firestore-Zugriff & Business-Logik

Kein separater Repository-Layer im architektonischen Sinn, aber seit
`docs/done/firestore-repository-service-plan.md` auch kein wildes `doc()`/`getDoc()`/
`updateDoc()` mehr direkt in Komponenten verstreut — die Firestore-Zugriffe sind in den
Repository-Services unten gebündelt.

## Repository-Services (Firestore-Zugriff)

- **`firestore-repository.service.ts`** — Basis: `FirestoreOperationError` (typisierter Fehler
  mit Operation + Pfad) und DI-injiziertes `Firestore`. Andere Repository-Services bauen darauf
  auf statt jeweils eigene Fehlerbehandlung zu erfinden.
- **`firestore-sync.service.ts`** — die beiden Live-Subscriptions, die `PlayerHandComponent`
  braucht (`watchGamesCollection()`, `watchPlayerDoc()`), inkl. `onSnapshot`-Fehler-Callback,
  der als `FirestoreOperationError` auf den Observable-Error-Kanal gemeldet wird statt
  verschluckt zu werden. Reine Zugriffslogik — welche NGXS-Actions aus den Snapshots dispatcht
  werden, bleibt in der Komponente.
- **`game-repository.service.ts`** / **`player-repository.service.ts`** — Lesen/Schreiben von
  Spiel- bzw. Spieler-Dokumenten. Ersetzen die früheren `SaveGameService`/`LoadGameService`/
  `GamePlayerService` (konsolidiert, siehe Plan oben). `updateTimerStartedAt()` ist der
  Firestore-Write für den Dungeon-Timer (`src/app/components/game/CLAUDE.md`).
- **`current-user.service.ts`** — Auth-State (`@angular/fire/auth`) + zugehöriges
  Firestore-Nutzerdokument.

## Business-Logik-Services (kein/kaum Firestore-Zugriff)

- **`card-play.service.ts`** — Karten-/Encounter-Regeln (Karte ausspielen, Encounter-Auflösung
  inkl. Singleplayer-Sonderfälle). `chooseCard()` ist der einzige öffentliche Einstiegspunkt —
  neue Kartenregeln hier einhängen, nicht an der Komponente vorbei. Startet außerdem per
  `ensureGameTimerStarted()` den Dungeon-Timer bei der ersten wirksam gespielten Karte — Details
  zum Gesamt-Feature in `src/app/components/game/CLAUDE.md`.
- **`heropower.service.ts`** — Prüft/löst die zehn unterschiedlichen Heldenfähigkeiten aus.
  Bewusst **nicht** vollständig auf eine gemeinsame Hilfsmethode vereinheitlicht (Walküre/
  Jägerin/"Array"-Gruppe haben einen dokumentierten Verhaltensunterschied im Dispatch-Timing,
  siehe Kommentar/Status direkt in der Datei) — vor einer Vereinheitlichung diesen Unterschied
  erneut prüfen, nicht blind zusammenlegen.
- **`dieb.service.ts`** — heldenspezifische Sonderlogik für den Dieb (Solo-Held im
  Singleplayer-Modus, siehe `docs/planned/singleplayer-mode-plan.md`).
- **`game-factory.service.ts`** — baut ein neues `Game`-Objekt (Startscreen: Spiel erstellen).
- **`auth-form.service.ts`** — Login/Register-Aufrufe + Mapping der Firebase-Error-Codes auf
  deutsche Meldungen; von allen Auth-bezogenen Formularen genutzt statt eigenem Error-Mapping
  pro Komponente.
- **`to-json.service.ts`** — Serialisierung von Domänen-Objekten (Hero/Card/...) für Firestore-
  Writes.

## Muster für neue Services

Neuer Firestore-Zugriff → auf `FirestoreRepositoryService`/`FirestoreOperationError` aufbauen,
nicht erneut rohes `doc()`/`getDoc()` in eine Komponente schreiben. Reine Spielregeln gehören in
einen Business-Logik-Service, nicht in die Komponente — Komponenten sollen nur noch
orchestrieren (Store lesen, Service-Methode aufrufen, Ergebnis anzeigen).
