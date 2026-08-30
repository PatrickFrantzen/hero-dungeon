# src/app/states/ — NGXS State Management

## Registrierung ist einzige Quelle der Wahrheit: `app.config.ts`

Ob ein State unter diesem Ordner tatsächlich aktiv ist, entscheidet ausschließlich das
`provideStore([...])`-Array in `src/app/app.config.ts`. Diese Datei hier kann veralten — ein
State-File kann existieren, ohne registriert zu sein (Beispiel aus der Vergangenheit: ein nicht
registrierter `MobState` wurde deswegen entfernt, siehe
`docs/done/review-2026-08/01-state-management.md`). Vor jeder Aussage über "aktive States"
`app.config.ts` gegenlesen statt dieser Liste zu vertrauen.

Aktuell registriert (Stand des letzten Abgleichs): `cardsInHandState`, `CardStackState`,
`CurrentGameState`, `CurrentUserState`, `DeliveryStackState`, `heropowerState`, `LobbyState`,
`EncounterState`.

## Aufteilung (nach `docs/planned/currentGame-state-split-plan.md` bzw. dessen aktuellem Status)

`currentGame-state.ts` bündelte ursprünglich vier fachlich unabhängige Verantwortlichkeiten in
einem State. Davon sind bereits herausgelöst:

- **`lobby-state.ts`** (`LobbyState`) — `choosenHeros` (welche Spieler mit welchem Helden).
- **`encounter-state.ts`** (`EncounterState`) — `currentEnemy`/`currentBoss`/`currentMob`/
  `allBosses`. `allBosses` ist seit der Boss-Kampagne (TODO 4,
  `docs/planned/five-minute-dungeon-rules-plan.md`) die Warteschlange der nach dem aktuellen
  Boss noch ausstehenden Bosse (analog zu `Mob` als Warteschlange der Dungeon-Karten) — **nicht**
  mehr die vollständige 5-Boss-Liste. `SetCurrentBoss`/`SetRemainingBosses`-Actions werden von
  `CardPlayService.prepareNextDungeon()` dispatcht, sobald ein Boss besiegt ist; `PlayerHandComponent.updateFromDatabase()`
  synct beide Felder bei jedem Firestore-Snapshot, damit der Boss-Wechsel bei allen Mitspielern
  ankommt.
- **`currentGame-state.ts`** (`CurrentGameState`) — der Rest: `{ items, numberOfPlayers,
  gameId, difficulty, isLost, questCardActivated, timerStartedAt, timerDurationSeconds,
  timerPausedAt, timerPausedSecondsTotal }`. Die Timer-Felder gehören zum Dungeon-Countdown-Timer
  — Details zum kompletten Feature (Start-Trigger, Pause, Anzeige, Firestore-Sync) in
  `src/app/components/game/CLAUDE.md`, hier nur der State-Teil: `StartGameTimer`-Action,
  Reducer-Guard `timerStartedAt !== null` (setzt den Timer nur einmal, ein späterer Dispatch
  überschreibt einen bereits laufenden Timer nicht); `SetGameTimerPauseState` setzt die
  Pause-Felder dagegen bedingungslos; `ResetGameTimer` setzt bei einem Boss-Wechsel alle drei
  Timer-Felder bedingungslos zurück auf "noch nicht gestartet" (umgeht bewusst den
  `StartGameTimer`-Guard, da der Timer für den nächsten Dungeon wieder von vorn losläuft).

Weitere States: `cardStack-state.ts`/`cardsInHand-state.ts`/`deliveryStack-state.ts` (die drei
Kartenstapel: Nachziehstapel, Hand, Ablage), `currentUser-state.ts` (eingeloggter Nutzer),
`heropower-state.ts` (aktuell aktive Heldenfähigkeit).

**Wichtig für mehrere States, die dieselbe Action behandeln:** Mehrere States können
`@Action(CurrentGameData)`-Handler für dieselbe dispatchte Action-Klasse haben — jeder patcht
nur seine eigene Teilmenge der Felder. Das ist bewusst so gelöst (nicht ein einzelner Handler,
der `state.game` komplett ersetzt), damit ein späterer, gezielter Dispatch (z.B. `SetNewEnemy`)
nicht versehentlich von einem nachfolgenden `CurrentGameData`-Dispatch zurücküberschrieben
werden kann.

## Zusammenspiel actions/ ↔ states/ ↔ Lesezugriff

- **`src/app/actions/`** — eine Action-Klasse pro Intent (z.B. `SetNewEnemy` in
  `currentGame-action.ts`), keine eigene Logik, nur Payload.
- **`src/app/states/*.ts`** — `@Action(...)`-Handler, die per `ctx.patchState(...)` bzw.
  `ctx.setState(...)` genau das ändern, was die Action beschreibt.
- **`src/app/selectors/`** — abgeleitete/kombinierte Reads (z.B. `currentGame-selector.ts`).
  Für einfache Feld-Reads in Komponenten wird i.d.R. direkt `store.selectSignal(...)` mit dem
  passenden State-Selector verwendet, nicht der ältere `@Select()`-Decorator (siehe Root-
  `CLAUDE.md`, Abschnitt Signals).

Neue States/Actions folgen demselben Dreiklang: Action definieren → Handler im passenden State
→ Lesezugriff über `selectSignal`/Selector. Bei einer neuen fachlichen Verantwortlichkeit erst
prüfen, ob sie in einen bestehenden State gehört oder — wie bei Lobby/Encounter — einen eigenen
verdient.
