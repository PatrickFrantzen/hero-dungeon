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

## Nicht Teil dieses Grundgerüsts (folgt in PR 4/6, Issues #76/#78)

Spiel-ID/Einladungslink anzeigen und "Meine Spiele" für Multiplayer — beide brauchen die
Anonymous-Auth-Infrastruktur, die es laut Plan noch nicht gibt. Multiplayer zeigt aktuell nur
"Verlassen" + Hinweistext.

## Logout

`StartscreenComponent.logout()` ist bewusst **nicht** hierher verschoben — der Plan sieht das
zwar vor (`docs/planned/login-multiplayer-onboarding-plan.md`, Zielbild "In-Game-Menü"), aber
nur "wenn ein Account existiert"; ohne die Anonymous-Auth-Arbeit aus PR 4 gibt es im
Singleplayer-Pfad noch keinen Account-Zustand, der das rechtfertigen würde.
