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
  `GamePlayerService` (konsolidiert, siehe Plan oben). `updateTimerStartedAt()`/
  `updateTimerPauseState()`/`resetTimer()` sind die Firestore-Writes für den Dungeon-Timer inkl.
  Pause/Reset (`src/app/components/game/CLAUDE.md`); `updateCurrentBoss()`/
  `updateRemainingBosses()` sind die Firestore-Writes für die Boss-Kampagne (siehe
  `card-play.service.ts` unten).
- **`current-user.service.ts`** — Auth-State (`@angular/fire/auth`) + zugehöriges
  Firestore-Nutzerdokument.

## Business-Logik-Services (kein/kaum Firestore-Zugriff)

- **`card-play.service.ts`** — Karten-/Encounter-Regeln (Karte ausspielen, Encounter-Auflösung
  inkl. Singleplayer-Sonderfälle). `chooseCard()` ist der Einstiegspunkt für alle Karten ohne
  weitere Nutzereingabe — neue Kartenregeln hier einhängen, nicht an der Komponente vorbei.
  Startet außerdem per `ensureGameTimerStarted()` den Dungeon-Timer bei der ersten wirksam
  gespielten Karte und beendet per `resumeGameTimerIfPaused()` eine laufende Magier-/
  Göttlicher-Schild-Pause, sobald eine Karte in die Tischmitte gespielt wird;
  `resolveGoettlicherSchild()`, `resolveHeiligeHandgranate()` und `resolveHeiltrank()` behandeln
  die gleichnamigen Karten als Sonderfall (keine passen zu Dungeon-Symbolen, sind aber jederzeit
  spielbar) — Details zum Gesamt-Feature in `src/app/components/game/CLAUDE.md`. Fünf weitere
  Aktionskarten mit Zielspieler-Auswahl (Spende, Stehlen, Heilkräuter, Wut, Heilung) haben
  eigene öffentliche `resolve*()`-Methoden, die **nicht** über `chooseCard()` laufen, sondern
  direkt von `PlayerHandComponent` aufgerufen werden, nachdem dort ein Zielspieler-Dialog
  geschlossen wurde (`chooseCard()` selbst würde diese Kartennamen nicht erkennen).
  `checkForNextEnemy()` ruft bei besiegtem Boss `prepareNextDungeon()` auf: solange
  `EncounterSelectors.currentAllBosses()` (die Warteschlange der noch ausstehenden Bosse #2-#5)
  nicht leer ist, wird per `new Monster().createMob(...)` ein neuer Dungeon-Kartenstapel für den
  nächsten Boss gebaut und der Timer per `ResetGameTimer` zurückgesetzt (Boss-Kampagne, Anleitung
  S. 6); erst wenn die Warteschlange leer ist (Boss #5 besiegt), wird `gameStatus: 'won'` gesetzt.
- **`heropower.service.ts`** — Prüft/löst die zehn unterschiedlichen Heldenfähigkeiten aus.
  Bewusst **nicht** vollständig auf eine gemeinsame Hilfsmethode vereinheitlicht (Walküre/
  Jägerin/"Array"-Gruppe haben einen dokumentierten Verhaltensunterschied im Dispatch-Timing,
  siehe Kommentar/Status direkt in der Datei) — vor einer Vereinheitlichung diesen Unterschied
  erneut prüfen, nicht blind zusammenlegen. `resolveMagierHeropower()` pausiert zusätzlich den
  Dungeon-Timer (`src/app/components/game/CLAUDE.md`).
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
