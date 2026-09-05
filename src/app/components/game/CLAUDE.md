# game/ — GameComponent (Host + Dungeon-Timer)

## Rejoin nach TTL-gelöschtem eigenen Spieler-Dokument (Issue #77)

`checkIfPlayerIsAlreadyPartOfGame()`/`loadHandstack()`: ist der Nutzer laut dem geteilten
`games/{gameId}`-Dokument (`choosenHeros`) weiterhin Teil des Spiels, aber sein eigenes
`games/{gameId}/player/{playerId}`-Unterdokument inzwischen weg (z.B. 7-Tage-TTL auf
`lastActivityAt`, `services/CLAUDE.md`), fällt `loadHandstack()` auf denselben Pfad wie ein
frischer Beitritt zurück (`createNewPlayer()` + `openDialog()` zur erneuten Heldenwahl) statt
`undefined` in Hand-/Ablagestapel zu dispatchen — sonst bliebe der Nutzer mit leerer Hand ohne
Möglichkeit hängen, erneut einen Helden zu wählen (beide `CurrentCardsInHand`/
`CurrentDeliveryStack`-Reducer ignorieren `undefined` bereits defensiv, das Symptom wäre also
kein Absturz, sondern ein stiller Dead-End).

## "Spielstand löschen" für Multiplayer (Issue #85)

`deleteOwnMultiplayerData()` — von `GameMenuComponent`s `(deleteGame)`-Output aufgerufen, erst
nach Bestätigung durch den Nutzer (siehe `game-menu/CLAUDE.md`). Löscht das eigene
`games/{gameId}/player/{playerId}`-Dokument (`PlayerRepositoryService.deleteOwnPlayerDoc()`),
entfernt den eigenen Eintrag aus `this.players`/`choosenHeros` (`gameRepo.addPlayerToGame()` mit
der gefilterten Liste, siehe `services/CLAUDE.md`) und navigiert danach zu `/startscreen`. Das
Spiel selbst bleibt für die übrigen Mitspieler bestehen — sie vertragen ein fehlendes
Spieler-Dokument bereits (Issue #77). Ein leeres, verwaistes `games/{gameId}`-Dokument (letzter
Spieler löscht seinen Spielstand) wird bewusst **nicht** aufgeräumt, siehe `services/CLAUDE.md`.

`GameComponent` hostet `EnemyContainerComponent`/`PlayerHandComponent`/`GameMenuComponent`
(Issue #74, `game-menu/CLAUDE.md`), lädt beim Einstieg das Spieldokument
(`checkIfPlayerIsAlreadyPartOfGame()`) und rendert den Dungeon-Countdown-Timer. Kein eigener
Container/Presenter-Split hier — die Komponente selbst orchestriert Firestore-Reads
(`GameRepositoryService`/`PlayerRepositoryService`) und Store-Dispatches.
`GameMenuComponent` bekommt `[isSingleplayer]="currentNumberOfPlayers() === 1"` und
`[gameId]="currentGameId()"` als Inputs, `(leave)` ist auf das bestehende
`backToStartscreen()` verdrahtet — permanent sichtbar, unabhängig von `currentGameStatus()`.

## Account-Angebot bei Singleplayer-Spielende (Issue #75, PR 3)

`offerAccountCreationOnGameEnd()` (per `effect()` im Konstruktor, da eine reine
`computed()`/Template-Bedingung keinen "gerade erst passiert"-Übergang erkennen kann) öffnet
`DialogAccountOfferComponent`, sobald `currentGameStatus()` von einem anderen Wert nach
`'won'`/`'lost'` wechselt (`lastGameStatus`-Vergleich, kein Signal - reine Buchhaltung, keine
eigene Reaktivität nötig) **und** das Spiel lokal + Solo + ohne Account ist
(`isLocalGameId(currentGameId())`, `currentNumberOfPlayers() === 1`, `!currentUserId()`).
`retryCampaign()`/`continueToNextDungeon()` setzen `gameStatus` wieder auf `'playing'` zurück,
ein späteres erneutes `'lost'`/`'won'` ist daher eine neue Transition und öffnet den Dialog
erneut (Zielbild: "Frage erscheint beim nächsten Spielende erneut"). Der Dialog selbst
(`dialog-account-offer/`) führt Registrierung + Migration aus, `GameComponent` wertet das
Ergebnis nicht weiter aus (kein Navigations-/State-Wechsel nach Abschluss).

## Dungeon-Timer — Feature ist über mehrere Verzeichnisse verteilt

Ein persistierter Fünf-Minuten-Timer, der mit der ersten gespielten Karte startet und das Spiel
bei Ablauf verliert. Beim Anfassen dieses Features müssen mehrere Stellen konsistent bleiben:

- **`src/models/game.ts`** — `timerStartedAt: number | null`, `timerDurationSeconds: number`
  als Teil des persistierten `Game`-Dokuments, plus `timerPausedAt: number | null` und
  `timerPausedSecondsTotal: number` fürs Pausieren (Magier "Zeit einfrieren", Walküre/Paladin
  "Göttlicher Schild" — siehe unten).
- **`src/app/services/game-factory.service.ts`** — neues Spiel startet mit
  `timerStartedAt: null, timerDurationSeconds: 300, timerPausedAt: null,
  timerPausedSecondsTotal: 0`.
- **`src/app/actions/currentGame-action.ts`** (`StartGameTimer`, `SetGameTimerPauseState`) →
  **`src/app/states/currentGame-state.ts`** (Reducer setzt `timerStartedAt` nur einmal — Guard
  `if (ctx.getState().timerStartedAt !== null) return;`, damit ein späterer Dispatch den bereits
  laufenden Timer nicht zurücksetzt; `SetGameTimerPauseState` setzt `timerPausedAt`/
  `timerPausedSecondsTotal` dagegen bedingungslos, weil dieselbe Action sowohl vom auslösenden
  Client als auch von `PlayerHandComponent`s Firestore-Sync für alle anderen Clients verwendet
  wird) → **`src/app/selectors/currentGame-selector.ts`** (`currentTimerStartedAt`,
  `currentTimerDurationSeconds`, `currentTimerPausedAt`, `currentTimerPausedSecondsTotal`).
- **`src/app/services/card-play.service.ts`** (`ensureGameTimerStarted()`) — der einzige Ort,
  der den Timer tatsächlich startet: bei der ersten Karte, die einen Effekt auslöst (nicht bei
  jedem `chooseCard()`-Aufruf), dispatcht die Action und schreibt `timerStartedAt` per
  **`src/app/services/game-repository.service.ts`** (`updateTimerStartedAt()`) nach Firestore.
  Neue Stellen, die eine Karte "wirksam spielen", müssen `ensureGameTimerStarted()` selbst
  aufrufen — es passiert nicht automatisch über den State.
- **Timer-Pause (Magier/Göttlicher Schild)** — Anleitungsregel S. 8: "Zeit bleibt eingefroren,
  bis ein Spieler eine Karte in die Tischmitte spielt"; Heropower-Nutzung und das Aufdecken der
  nächsten Dungeon-Karte beenden die Pause ausdrücklich NICHT.
  - `CardPlayService.resumeGameTimerIfPaused()` wird an genau den drei Stellen in `chooseCard()`
    aufgerufen, die tatsächlich eine Ressourcen-/Aktionskarte in die Tischmitte spielen (parallel
    zu den bestehenden `ensureGameTimerStarted()`-Aufrufen) — akkumuliert die abgelaufene
    Pausendauer in `timerPausedSecondsTotal` und setzt `timerPausedAt` auf `null`.
  - `HeropowerService.resolveMagierHeropower()` — 3 Handkarten ablegen, pausiert dafür den
    Timer (`timerPausedAt = Date.now()`), sofern der Timer bereits läuft und nicht schon
    pausiert ist. Verdrahtet über `HeropowerContainerComponent` (`case 'Magier':` emittiert
    `'magier'`) → `PlayerHandComponent.onHeropowerResolved()`.
  - `CardPlayService.resolveGoettlicherSchild()` (card === `'göttlicherSchild'`, Sonderfall ganz
    am Anfang des `else`-Zweigs in `chooseCard()`, da diese Karte kein Dungeon-Symbol matcht und
    jederzeit spielbar ist) — pausiert den Timer und lässt jeden Spieler 1 Karte ziehen,
    unabhängig von der sonst geltenden Handgrößen-Obergrenze (Anleitung S. 6, Anmerkung Punkt 4).
  - `GameRepositoryService.updateTimerPauseState()` — einziger Firestore-Write für beide
    Pause-Felder gemeinsam.
- **Timer-Reset (Boss-Kampagne)** — `ResetGameTimer`-Action (`currentGame-action.ts`) setzt
  bedingungslos alle drei Timer-Felder zurück (`timerStartedAt`/`timerPausedAt: null`,
  `timerPausedSecondsTotal: 0`), umgeht also bewusst den `StartGameTimer`-Guard. Ausgelöst von
  `CardPlayService.continueToNextDungeon()`/`restartCampaign()` (Anleitung S. 6: "Setzt den
  Timer wieder auf 5 Minuten"), nachdem ein Spieler bestätigt hat, mit dem nächsten Dungeon
  weiterzumachen bzw. nach einem verlorenen Dungeon neu zu starten — Details zu diesem
  Bestätigungs-Flow unten und in `src/app/services/CLAUDE.md`. `GameRepositoryService.resetTimer()`
  ist der zugehörige Firestore-Write. `PlayerHandComponent.updateFromDatabase()` dispatcht
  `ResetGameTimer` auch dann, wenn `data['timerStartedAt']` beim Sync `null` statt einer Zahl
  ist — sonst würde ein bereits gestarteter lokaler Timer bei anderen Clients nach einem
  Boss-Wechsel/Neustart nicht zurückgesetzt.
- **`src/app/services/to-json.service.ts`** — serialisiert alle vier Timer-Felder mit, wenn ein
  `Game`-Objekt nach Firestore geschrieben wird.
- **`src/app/components/player-hand/player-hand.component.ts`** (`updateFromDatabase()`) —
  dispatcht bei jedem Firestore-Snapshot des Spieldokuments `SetGameTimerPauseState` mit den
  aktuellen `timerPausedAt`/`timerPausedSecondsTotal`-Werten aus Firestore, damit die Pause
  (ausgelöst von einem beliebigen Client) bei allen Mitspielern ankommt.
- **Diese Komponente (`game.component.ts`)** — einziger Ort, der die Zeit tatsächlich
  herunterzählt: `now` (Signal, per `setInterval` im Sekundentakt aktualisiert) plus
  `remainingSeconds`/`formattedRemainingTime` (`computed()` aus `timerStartedAt`/
  `timerDurationSeconds`/`timerPausedAt`/`timerPausedSecondsTotal`/`now` — während einer Pause
  bleibt `remainingSeconds` beim `timerPausedAt`-Zeitpunkt stehen statt mit `now()`
  weiterzulaufen). `isTimerPaused` (`computed()`) steuert die `game-timer--paused`-CSS-Klasse
  und den Pause-Hinweistext im Template. `markGameLostWhenTimerRunsOut()` dispatcht
  `UpdateGameStatus('lost')` und schreibt es nach Firestore, sobald die Zeit abläuft — mit
  `timeoutReported`-Flag gegen mehrfaches Auslösen. `ngOnDestroy()` räumt das Interval auf.

Der Timer-Zustand selbst ist reiner Store-State (kein eigener `TimerState`) — bewusst in
`CurrentGameState` untergebracht, weil er zum Spiel-Lebenszyklus gehört, nicht zu Encounter/
Lobby (siehe `src/app/states/CLAUDE.md` zur Aufteilung von `currentGame-state.ts`). Eine
Änderung an der Timer-Dauer oder ein zusätzlicher Timer-Typ betrifft potenziell alle oben
genannten Dateien — nicht nur diese Komponente.

- **Timer-Pause bei Boss-Sieg** — `CardPlayService.checkForNextEnemy()` friert den Timer
  (`freezeGameTimer()`, dieselbe Pause-Mechanik wie Magier/Göttlicher Schild) zusätzlich immer
  dann ein, wenn ein Boss besiegt wird (`gameStatus` wechselt auf `'bossDefeated'` oder `'won'`)
  — sonst läuft die sichtbare Zeit während der Bestätigungs-Entscheidung (siehe unten) bzw. nach
  Spielsieg sinnlos weiter, obwohl `markGameLostWhenTimerRunsOut()` wegen des
  `gameStatus !== 'playing'`-Guards ohnehin keinen Verlust mehr auslösen könnte.
  `continueToNextDungeon()`/`restartCampaign()` setzen die Pause über `ResetGameTimer`
  ohnehin bedingungslos zurück, sobald die Gruppe weitermacht.

## Kampagnen-Statistik (`GameStats`, `src/models/game.ts`)

Vier Zähler (`enemiesDefeated`, `cardsPlayed`, `cardsCycled`, `heropowersUsed`), synct/persistiert
analog zu den Timer-Feldern (`GameRepositoryService.updateStats()`, `SetGameStats`-Action,
`CurrentGameState`/`CurrentGameSelectors.currentStats`, `PlayerHandComponent.updateFromDatabase()`
für den Sync bei anderen Clients). Läuft über die **gesamte Kampagne** mit (wird weder von
`continueToNextDungeon()` noch von `restartCampaign()` zurückgesetzt) — bewusst kumulativ, nicht
pro Dungeon.

- `CardPlayService.bumpStat()`/`HeropowerService.bumpStat()` (zwei separate, bewusst nicht
  geteilte Implementierungen, analog zur Nicht-Vereinheitlichung der Heropower-Methoden) liest
  den aktuellen Wert aus dem Store, addiert das Delta und schreibt den neuen absoluten Wert
  lokal + nach Firestore (kein Firestore `increment()` — bei echtem gleichzeitigem Schreiben
  zweier Clients ist ein Lost-Update theoretisch möglich, wie bei den übrigen Feldern in diesem
  Modul auch).
- **`enemiesDefeated`** — `CardPlayService.checkForNextEnemy()`, dem einzigen Funnel für "eine
  Bedrohung ist auf 0 Token": zählt nur bei den festen Gegnertypen (`ENEMY_TYPES`-Konstante:
  Monster/Person/Hindernis/Mini-Boss/Boss), nicht bei Ereigniskarten (deren `type`-Feld ein
  Fließtext-Effekt ist, siehe `monster-collection.data.ts`).
- **`cardsPlayed`** — `CardPlayService.ensureGameTimerStarted()`: an allen 13 Stellen aufgerufen,
  an denen `chooseCard()`/eine `resolve*()`-Methode tatsächlich eine Karte wirksam spielt (siehe
  `services/CLAUDE.md`) — zählt bei jedem Aufruf hoch, unabhängig vom Timer-Start-Guard.
- **`cardsCycled`** — zwei Zählstellen: `CardPlayService.drawCards()` zählt, sobald der
  Ablagestapel gemischt zum Nachziehstapel wird (Stapel leer, Ablage nicht), die Anzahl der so
  wieder verfügbaren Karten (zentral in dieser privaten Methode, alle 6 Aufrufer reichen dafür nur
  noch `gameId` durch und übernehmen die dabei entstehende Write-Promise aus dem zurückgegebenen
  `WithWrites`-Objekt, siehe `services/CLAUDE.md`); zusätzlich zählt `CardPlayService.restCard()`
  ("Rasten", Singleplayer-Deadlock-Schutz) das eigentliche Rasten-Ereignis selbst um 1 hoch,
  unabhängig davon, ob dabei ein Reshuffle nötig war — vorher war das die einzige Lücke: der
  Reshuffle-Zweig in `drawCards()` griff beim Rasten praktisch nie, weil der Nachziehstapel dabei
  meist noch nicht leer war, wodurch "Gecyclete Karten" trotz mehrfachem Rasten bei 0 blieb (Bug,
  behoben). Rasten ist über `player-hand.component.ts`s `isSingleplayer()` bereits auf
  Singleplayer beschränkt, daher zeigt die Statistik diesen Zähler im Multiplayer ohnehin nie an.
- **`heropowersUsed`** — je einmal in `HeropowerService.resolveWalkuereHeropower()`/
  `resolveJaegerinHeropower()`/`resolveMagierHeropower()`/`resolveArrayHeropower()`, direkt nach
  deren bestehendem `heropowerArray().length !== 3`-Guard. Der Dieb (Solo-Singleplayer-Held) läuft
  nicht über `HeropowerService`, sondern über `DiebService.heropower()` (siehe
  `components/heropower/CLAUDE.md`) — zählt seit einem Bugfix ebenfalls hoch, per eigenem,
  drittem `bumpStat`-Analogon direkt in `DiebService` (vorher fehlte der Zähler dort komplett,
  sichtbarstes Symptom: "Genutzte Heldenfähigkeiten" blieb beim Dieb immer 0).
- **Anzeige**: `GameComponent`, `.game-stats`-Block im Template, sichtbar sobald
  `gameStatus() !== 'playing'` (Boss-Bestätigung, Sieg, Niederlage) — bewusst nicht permanent
  während des laufenden Spiels eingeblendet, um die Sicht auf den Hintergrund nicht zu verdecken
  (siehe `components/CLAUDE.md`, Enemy-Card-Breite).

## Bestätigungs-Flow: Boss-Kampagne fortsetzen / Dungeon neu starten

`GameStatus` (`src/models/game.ts`) hat vier Werte: `'playing' | 'bossDefeated' | 'won' | 'lost'`.
`CardPlayService.checkForNextEnemy()` setzt bei besiegtem Boss **nicht automatisch** den
nächsten Dungeon auf, sondern `gameStatus: 'bossDefeated'` (sofern noch Bosse ausstehen, sonst
direkt `'won'`) — `PlayerHandComponent`/`EnemyContainerComponent` werden bei diesem Status
ausgeblendet (`@if (currentGameStatus() === 'playing' || ... === 'won')` in
`game.component.html`), damit während der Entscheidung nicht weitergespielt werden kann.

- **`gameStatus === 'bossDefeated'`** — Template zeigt "`{{ currentBoss().name }}` ist besiegt!
  Weiter mit dem nächsten Dungeon?" mit zwei Buttons: `continueToNextDungeon()` (ruft
  `CardPlayService.continueToNextDungeon(gameId, playerId, ...)` auf) oder `backToStartscreen()`
  (Client-seitige Navigation zu `/startscreen`, ändert den Firestore-Spielstand nicht — andere
  Spieler sehen die Bestätigung weiterhin und können selbst entscheiden).
- **`gameStatus === 'lost'`** — Template zeigt zusätzlich zur bestehenden Fehlermeldung zwei
  Buttons: `retryCampaign()` (ruft `CardPlayService.restartCampaign(gameId, playerId, ...)` auf,
  baut den Dungeon zurück auf Boss #1 — Anleitung S. 7: "versucht euer Glück von neuem mit dem
  Baby-Barbar") oder `backToStartscreen()`.
- Beide `continueToNextDungeon()`/`retryCampaign()` setzen zusätzlich `this.timeoutReported =
  false` zurück — ohne das würde `markGameLostWhenTimerRunsOut()` nach dem ersten Timeout in
  diesem Client nie wieder auslösen, weil das Flag nur beim Neuladen der Seite zurückgesetzt
  würde.
- `CardPlayService.continueToNextDungeon()`/`restartCampaign()` mischen als Teil des Neustarts
  über `reshuffleAllPlayersForNewDungeon()` auch das Heldendeck jedes Spielers frisch (Details:
  `src/app/services/CLAUDE.md`) — nicht nur den Dungeon-Kartenstapel.
