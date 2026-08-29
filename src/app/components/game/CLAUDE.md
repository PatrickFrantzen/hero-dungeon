# game/ — GameComponent (Host + Dungeon-Timer)

`GameComponent` hostet `EnemyContainerComponent`/`PlayerHandComponent`, lädt beim Einstieg das
Spieldokument (`checkIfPlayerIsAlreadyPartOfGame()`) und rendert den Dungeon-Countdown-Timer.
Kein eigener Container/Presenter-Split hier — die Komponente selbst orchestriert Firestore-Reads
(`GameRepositoryService`/`PlayerRepositoryService`) und Store-Dispatches.

## Dungeon-Timer — Feature ist über mehrere Verzeichnisse verteilt

Ein persistierter Fünf-Minuten-Timer, der mit der ersten gespielten Karte startet und das Spiel
bei Ablauf verliert. Beim Anfassen dieses Features müssen mehrere Stellen konsistent bleiben:

- **`src/models/game.ts`** — `timerStartedAt: number | null`, `timerDurationSeconds: number`
  als Teil des persistierten `Game`-Dokuments.
- **`src/app/services/game-factory.service.ts`** — neues Spiel startet mit
  `timerStartedAt: null, timerDurationSeconds: 300`.
- **`src/app/actions/currentGame-action.ts`** (`StartGameTimer`) →
  **`src/app/states/currentGame-state.ts`** (Reducer setzt `timerStartedAt` nur einmal — Guard
  `if (ctx.getState().timerStartedAt !== null) return;`, damit ein späterer Dispatch den bereits
  laufenden Timer nicht zurücksetzt) →
  **`src/app/selectors/currentGame-selector.ts`** (`currentTimerStartedAt`,
  `currentTimerDurationSeconds`).
- **`src/app/services/card-play.service.ts`** (`ensureGameTimerStarted()`) — der einzige Ort,
  der den Timer tatsächlich startet: bei der ersten Karte, die einen Effekt auslöst (nicht bei
  jedem `chooseCard()`-Aufruf), dispatcht die Action und schreibt `timerStartedAt` per
  **`src/app/services/game-repository.service.ts`** (`updateTimerStartedAt()`) nach Firestore.
  Neue Stellen, die eine Karte "wirksam spielen", müssen `ensureGameTimerStarted()` selbst
  aufrufen — es passiert nicht automatisch über den State.
- **`src/app/services/to-json.service.ts`** — serialisiert beide Timer-Felder mit, wenn ein
  `Game`-Objekt nach Firestore geschrieben wird.
- **Diese Komponente (`game.component.ts`)** — einziger Ort, der die Zeit tatsächlich
  herunterzählt: `now` (Signal, per `setInterval` im Sekundentakt aktualisiert) plus
  `remainingSeconds`/`formattedRemainingTime` (`computed()` aus `timerStartedAt`/
  `timerDurationSeconds`/`now`). `markGameLostWhenTimerRunsOut()` dispatcht `UpdateGameStatus
  ('lost')` und schreibt es nach Firestore, sobald die Zeit abläuft — mit `timeoutReported`-Flag
  gegen mehrfaches Auslösen. `ngOnDestroy()` räumt das Interval auf.

Der Timer-Zustand selbst ist reiner Store-State (kein eigener `TimerState`) — bewusst in
`CurrentGameState` untergebracht, weil er zum Spiel-Lebenszyklus gehört, nicht zu Encounter/
Lobby (siehe `src/app/states/CLAUDE.md` zur Aufteilung von `currentGame-state.ts`). Eine
Änderung an der Timer-Dauer oder ein zusätzlicher Timer-Typ betrifft potenziell alle oben
genannten Dateien — nicht nur diese Komponente.
