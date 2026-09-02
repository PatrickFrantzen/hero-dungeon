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
  `card-play.service.ts` unten); `updateStats()` schreibt die vier Kampagnen-Statistik-Zähler
  (`GameStats`, siehe `src/app/components/game/CLAUDE.md`).
- **`current-user.service.ts`** — Auth-State (`@angular/fire/auth`) + zugehöriges
  Firestore-Nutzerdokument.

## Business-Logik-Services (kein/kaum Firestore-Zugriff)

- **`card-play.service.ts`** — Karten-/Encounter-Regeln (Karte ausspielen, Encounter-Auflösung
  inkl. Singleplayer-Sonderfälle). `chooseCard()` ist der Einstiegspunkt für alle Karten ohne
  weitere Nutzereingabe — neue Kartenregeln hier einhängen, nicht an der Komponente vorbei.
  `resolveEvent()` (aufgerufen über den "Event ausführen"-Button in `PlayerHandComponent`,
  sichtbar sobald `currentEnemy().token.includes('event')` — Spielerzahl-unabhängig) wendet den
  Ereignis-Effekt auf ALLE Spieler an (`applyEventToSelf()`/`applyEventToOtherPlayers()`), nicht
  nur auf den klickenden Spieler; "Chaos" ist dabei vereinfacht wie "Plötzliche Krankheit"
  behandelt (siehe Kommentar an `resolveEvent()` — die Anleitung gibt keine feste
  Weitergabe-Reihenfolge für "gibt seine Handkarten einem Mitspieler" vor). In `chooseCard()`
  darf nur die Karte `verhinderung_event` (Magier/Zauberin) eine Ereigniskarte stoppen — vorher
  löste jede beliebige Doppelkarte ein Event auf, weil nur geprüft wurde, ob überhaupt ein Event
  anliegt, nicht welche Karte gespielt wurde.
  Startet außerdem per `ensureGameTimerStarted()` den Dungeon-Timer bei der ersten wirksam
  gespielten Karte und beendet per `resumeGameTimerIfPaused()` eine laufende Magier-/
  Göttlicher-Schild-Pause, sobald eine Karte in die Tischmitte gespielt wird;
  `resolveGoettlicherSchild()`, `resolveHeiligeHandgranate()` und `resolveHeiltrank()` behandeln
  die gleichnamigen Karten als Sonderfall (keine passen zu Dungeon-Symbolen, sind aber jederzeit
  spielbar) — Details zum Gesamt-Feature in `src/app/components/game/CLAUDE.md`. Fünf weitere
  Aktionskarten mit Zielspieler-Auswahl (Spende, Stehlen, Heilkräuter, Wut, Heilung) haben
  eigene öffentliche `resolve*()`-Methoden, die **nicht** über `chooseCard()` laufen, sondern
  direkt von `PlayerHandComponent` aufgerufen werden, nachdem dort ein Zielspieler-Dialog
  geschlossen wurde (`chooseCard()` selbst würde diese Kartennamen nicht erkennen). `resolveJoker()`
  ist seit der Token-Auswahl (siehe unten) genauso ein Sonderfall: **nicht** mehr Teil von
  `chooseCard()`, sondern eine öffentliche Methode mit `chosenToken`-Parameter, aufgerufen aus
  `PlayerHandComponent`, nachdem der Spieler ein leuchtendes Enemy-Token angeklickt hat.
  `checkForNextEnemy()` setzt bei besiegtem Boss **nicht automatisch** den nächsten Dungeon auf,
  sondern `gameStatus: 'bossDefeated'` (sofern `EncounterSelectors.currentAllBosses()` — die
  Warteschlange der noch ausstehenden Bosse #2-#5 — nicht leer ist, sonst direkt `'won'`) — die
  Gruppe wird erst gefragt, ob sie weitermacht (`GameComponent`, siehe
  `src/app/components/game/CLAUDE.md`). `continueToNextDungeon(gameId, playerId, ...)` (öffentlich,
  von `GameComponent` nach Bestätigung aufgerufen) baut per `new Monster().createMob(...)` den
  Dungeon-Kartenstapel für den nächsten Boss, setzt den Timer per `ResetGameTimer` zurück und
  mischt über `reshuffleAllPlayersForNewDungeon()` jedes Spielers Heldendeck frisch (Anleitung
  S. 6: "Mischt die 40 Karten eines jeden Helden-Decks... und legt das Deck... auf das Feld
  Nachziehstapel") — dafür wird der Heldenname aus dem Spieler-Dokument gegen `HERO_DEFINITIONS`
  zurückgemappt (Player-Dokumente speichern aktuell keine `HeroId`, nur den Anzeigenamen).
  `restartCampaign(gameId, playerId, ...)` (nach verlorenem Dungeon) macht dasselbe, aber zurück
  auf Boss #1 (`GameFactoryService.buildNewGame()`), analog zu Anleitung S. 7 ("versucht euer
  Glück von neuem mit dem Baby-Barbar"). `resolveJoker()`/`resolveMagischeBombe()` behandeln die
  Jägerin/Waldläufer- bzw. Magier/Zauberin-Karten `joker`/`magischeBombe` als weiteren Sonderfall
  (matchen kein festes Dungeon-Symbol): Magische Bombe entfernt je ein Vorkommen jeder der 5
  Symbolfarben, ohne Nutzerauswahl (Anleitung S. 8: "muss aber nicht alle nutzen" — es wird
  trotzdem immer alles entfernt, was vorhanden ist, eine bewusste Vereinfachung). Joker
  entfernt seit der Token-Auswahl (2026-09-02, Live-Test-Feedback: Spieler sollen selbst
  entscheiden dürfen, welches Token sie damit ersetzen) genau das vom Spieler gewählte Token
  statt deterministisch das erste — siehe `chosenToken`-Parameter und Kommentar direkt an der
  Methode. Beide wirken nicht gegen Ereigniskarten.
  `checkHandDeadlockLoss(gameId, hand, cardStack, deliveryStack, ...)` (TODO 11, erster von zwei
  diagnostizierten Verlustwegen) setzt `gameStatus: 'lost'`, sobald ein Spieler gleichzeitig
  leere Hand-, Nachzieh- und Ablagestapel hat (kann seine Hand nicht mehr auffüllen) und der
  Status noch `'playing'` ist. Aufgerufen aus `persistPlayerStacks()` (deckt `checkHandsize()`,
  `drawCardsIgnoringHandsize()`, `restCard()`, `resolveSpende()` ab), `applyEventToPlayerData()`
  und `resolveStehlen()` — Stehlen ist praktisch der einzige Weg, diesen Zustand tatsächlich zu
  erreichen, da beim normalen Kartenausspielen die abgelegte Karte selbst sofort zurückgemischt
  und nachgezogen wird, solange irgendwo (Hand/Nachzieh-/Ablagestapel) noch eine Karte liegt. Die
  zweite Verlustbedingung ("Gruppe kann die geforderten Symbole nicht mehr aufbringen") ist
  bewusst nicht umgesetzt — siehe TODO 11 im Plan.
  `bumpStat()`/`ensureGameTimerStarted()`/`checkForNextEnemy()`/`drawCards()` schreiben zusätzlich
  die Kampagnen-Statistik (`GameStats`) fort — Details in `src/app/components/game/CLAUDE.md`.
- **`heropower.service.ts`** — Prüft/löst die zehn unterschiedlichen Heldenfähigkeiten aus.
  Bewusst **nicht** vollständig auf eine gemeinsame Hilfsmethode vereinheitlicht (Walküre/
  Jägerin/"Array"-Gruppe haben einen dokumentierten Verhaltensunterschied im Dispatch-Timing,
  siehe Kommentar/Status direkt in der Datei) — vor einer Vereinheitlichung diesen Unterschied
  erneut prüfen, nicht blind zusammenlegen. `resolveMagierHeropower()` pausiert zusätzlich den
  Dungeon-Timer (`src/app/components/game/CLAUDE.md`). Alle vier `resolve*Heropower()`-Methoden
  zählen über ihr eigenes `bumpStat()` (bewusst nicht mit `CardPlayService.bumpStat()` geteilt)
  die `heropowersUsed`-Statistik hoch.
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
