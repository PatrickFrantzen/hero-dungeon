# game-menu/ — In-Game-Menü (Issue #74, Grundgerüst)

`GameMenuComponent`, eingebunden in `game.component.html`, permanent sichtbar unabhängig von
`currentGameStatus()` (auch während `bossDefeated`/`lost`/`won`). Kein eigener Container — greift
direkt auf `LocalSingleplayerSaveService`/`Store`/`Router` zu, analog zu `game.component.ts`/
`startscreen/` (siehe `components/CLAUDE.md`, Smart/Dumb-Muster ist hier bewusst nicht
durchgezogen).

- **`isOpen`** (Signal) — auf/zu, per `toggle()`. Template zeigt das Panel nur, wenn offen.
- **"Speichern" (`onSave()`)** — **kein zusätzlicher Schreibvorgang**: jede Spielaktion
  (`CardPlayService`/`HeropowerService`) persistiert bereits synchron über
  `FirestoreRepositoryService`/`LocalGameDocumentStoreService` (siehe `services/CLAUDE.md`). Der
  Button liest nur `LocalSingleplayerSaveService.getSave(gameId)` und setzt `saveConfirmed` auf
  `true`, wenn der Save existiert — reine Nutzer-Bestätigung ("Gespeichert!"), kein neuer Write.
  Nur im Singleplayer sichtbar; Multiplayer zeigt stattdessen den Hinweistext "Automatisch
  gespeichert" (Firestore-Auto-Save bleibt dort unverändert).
- **"Spielstände laden" (`listSaves()`/`resumeSave()`)** — nur Singleplayer, identische Liste wie
  `StartscreenComponent`s "Meine Spielstände". `resumeSave(saveId)` dispatcht `CurrentGameAction`
  und navigiert nach `local-game/:id` — `GameComponent`/`PlayerHandComponent` laden den Rest beim
  Betreten der Route selbst (`loadLocalGameOnce()`).
- **"Verlassen" (`onLeave()`)** — `leave`-Output, `GameComponent` verdrahtet ihn auf das
  bestehende `backToStartscreen()`.

## "Meine Spiele" + Account verknüpfen für Multiplayer (Issue #78)

- **"Meine Spiele"** (`myGames`, analog zu `StartscreenComponent`) — lädt per `effect()` die
  Multiplayer-Historie aus `users/{uid}.games` (`UserRepositoryService.getUser()`), sobald
  `currentUserId()` (Store-Signal) verfügbar ist **und** `isSingleplayer()` false ist. Klick auf
  einen Eintrag ruft `resumeMultiplayerGame(gameId)` auf (analog zu `resumeSave()`, aber Route
  `game/:id` statt `local-game/:id`).
- **"Account verknüpfen"** (`canLinkAccount()`/`openLinkAccountDialog()`) — nur sichtbar, wenn
  `!isSingleplayer()` **und** `auth.currentUser?.isAnonymous` true ist (ein bereits verknüpfter/
  registrierter Account braucht den Button nicht mehr). Öffnet `DialogLinkAccountComponent`
  (`components/CLAUDE.md`, Abschnitt Dialoge), die die Verknüpfung selbst ausführt
  (`AuthFormService.linkAnonymousAccount()`).

## "Spielstand löschen" (Issue #85)

Eigener, klar von "Verlassen" (reine Navigation, keine Datenänderung) getrennter Button, weil
destruktiv — beide Modi öffnen zuerst `DialogConfirmComponent` (`components/CLAUDE.md`) über die
private `openConfirmDialog()`, erst nach `{ confirmed: true }` passiert etwas:

- **Singleplayer** (`confirmDeleteSingleplayerSave()`) — löscht direkt über
  `LocalSingleplayerSaveService.deleteSave(gameId())` (analog zu `onSave()` oben) und navigiert
  danach selbst zu `/startscreen`.
- **Multiplayer** (`confirmDeleteMultiplayerGame()`) — `GameMenuComponent` kennt weder
  `this.players` noch `currentUserId()` von `GameComponent`, kann die eigentliche Löschung also
  nicht selbst ausführen: emittiert stattdessen einen neuen Output `deleteGame`, den
  `GameComponent` auf `deleteOwnMultiplayerData()` verdrahtet (löscht das eigene Spieler-
  Unterdokument + entfernt den eigenen Eintrag aus `choosenHeros`, siehe `services/CLAUDE.md`
  und `game/CLAUDE.md`).

## Nicht Teil dieses Grundgerüsts (folgt in PR 4/6, Issues #76/#78)

Spiel-ID/Einladungslink anzeigen (Multiplayer) — laut
`docs/done/login-multiplayer-onboarding-plan.md`, Abschnitt "Nicht im Scope", bewusst nicht
Teil des Plans.

## Logout

`StartscreenComponent.logout()` ist weiterhin **nicht** hierher verschoben, obwohl die
Anonymous-Auth-Arbeit aus PR 4 inzwischen umgesetzt ist (der ursprüngliche Blocker für diese
Aussage) — der Plan sieht die Verschiebung zwar vor
(`docs/done/login-multiplayer-onboarding-plan.md`, Zielbild "In-Game-Menü", "nur wenn ein
Account existiert"), Issue #78s Aufgabenliste nennt sie aber nicht explizit; nicht ohne
gesonderten Auftrag verschieben.
