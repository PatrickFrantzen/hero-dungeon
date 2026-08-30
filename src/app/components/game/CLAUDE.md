# game/ — GameComponent (Host + Dungeon-Timer)

`GameComponent` hostet `EnemyContainerComponent`/`PlayerHandComponent`, lädt beim Einstieg das
Spieldokument (`checkIfPlayerIsAlreadyPartOfGame()`) und rendert den Dungeon-Countdown-Timer.
Kein eigener Container/Presenter-Split hier — die Komponente selbst orchestriert Firestore-Reads
(`GameRepositoryService`/`PlayerRepositoryService`) und Store-Dispatches.

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
