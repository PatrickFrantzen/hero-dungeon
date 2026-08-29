# Refactoring-Plan: `currentGame-state.ts` in fachliche States aufteilen

## Status (2026-08-29)

TODO 1-3 umgesetzt, jeweils build-/testgrün, in eigenen Commits: `LobbyState` (choosenHeros),
`EncounterState` (currentEnemy/currentBoss/Mob/allBosses), `CurrentGameState` auf
`{ items, numberOfPlayers, gameId, difficulty, isLost, questCardActivated }` reduziert.

TODO 3s offene Entscheidung (Race Condition durch `CurrentGameData.setGameData()`s
Wholesale-Replace von `state.game`) ist strukturell aufgelöst, nicht nur verlagert: jedes der
drei States hat einen eigenen `@Action(CurrentGameData)`-Handler, der nur seine eigene
Teilmenge der Felder aus dem dispatchten `Game`-Objekt patcht (NGXS unterstützt mehrere
Handler für dieselbe Action-Klasse über mehrere States) — ein späterer, gezielter Dispatch
(`SetNewEnemy`, `SetChoosenHeros`, ...) kann nicht mehr versehentlich von einem nachfolgenden
`CurrentGameData` zurücküberschrieben werden, weil `CurrentGameData` gar keinen Zugriff mehr
auf die Felder der anderen States hat.

`ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI` (33/33) und `npm run
test:rules` (9/9) grün. **TODO 4 (manueller Zwei-Browser-Smoke-Test) nicht durchgeführt** —
kein laufendes Firebase-Emulator-/Browser-Multiplayer-Setup in dieser Session verfügbar. Vor
dem Merge nachholen: Spiel erstellen, zweiter Spieler tritt bei, Karte spielen, Heropower
auslösen, Boss erreichen — deckt alle drei neuen States gemeinsam ab.

Kontext: Punkt 4 der „Empfohlenen Reihenfolge" aus
`docs/done/review-2026-08/00-overview.md`, Detailbefund 2/2b in
`docs/done/review-2026-08/01-state-management.md`. Befund 3 aus derselben Datei (Reducer auf
`...state.game`-Spread statt manueller Feldliste) ist bereits in PR #21 erledigt — dieser Plan
baut direkt darauf auf. Stand der Diagnose: 2026-08-29, nach PR #21.

## Diagnose

`src/app/states/currentGame-state.ts` (208 Zeilen) hat ein einziges `CurrentGameModel`
(`currentGame-state.ts:17-20`: `items: string`, `game: Game`) mit sieben Actions, die
mindestens vier fachlich unabhängige Bereiche abdecken:

- **Spiel-Identität/Metadaten**: `CurrentGameAction` (`currentGame-state.ts:49-61`, setzt
  `items`/`gameId`), `CurrentGameData` (`:63-75`, ersetzt den kompletten `Game`-Datensatz).
- **Gegner-/Encounter-State**: `UpdateMonsterTokenArray` (`:77-98`), `SetNewEnemy`
  (`:100-115`), `UpdateMobAction` (`:117-132`).
- **Spieler-/Lobby-State**: `updateChoosenHeros` (`:134-169`, hängt einen Spieler an),
  `SetChoosenHeros` (`:171-189`, ersetzt die komplette Liste).
- **Quest-Flag**: `updateQuestCardActivated` (`:191-207`).

`CurrentGameData.setGameData()` (`currentGame-state.ts:63-74`) ersetzt `state.game` komplett
per `ctx.setState({...state, game: gameData})` — das überschreibt implizit auch
`currentEnemy`/`Mob`/`choosenHeros`, die an anderer Stelle über eigene, gezieltere Actions
gepflegt werden. Wird `CurrentGameData` nach einem dieser gezielten Updates dispatcht (z.B. bei
einem erneuten vollständigen Firestore-Read in `PlayerHandComponent.updateFromDatabase()`,
`player-hand.component.ts:137-144`), können bereits aktuellere Teilzustände zurückgesetzt
werden — eine potenzielle Race Condition, abhängig von der Dispatch-Reihenfolge.

Aktuell liest `CurrentGameSelectors` (`src/app/selectors/currentGame-selector.ts`) sieben
Slices aus genau diesem einen State: `currentGame` (`items`), `currentGameState` (`game`
komplett), `currentEnemy`, `currentMob`, `currentBoss`, `currentPlayers`,
`currentQuestCardStatus`. Jeder Split muss diese Selector-API erhalten (Konsumenten in
`GameComponent`, `PlayerHandComponent`, `HeropowerContainerComponent`, `StartscreenComponent`
lesen ausschließlich über `CurrentGameSelectors`, nicht direkt über den State).

## TODOs

- [ ] **TODO 1 — `LobbyState` abspalten (unabhängigster Teil, geringstes Kopplungsrisiko)**
  - Neue Datei `src/app/states/lobby-state.ts`: `LobbyModel { choosenHeros:
    {playerName, playerId, playerHero}[] }`, Actions `updateChoosenHeros`/`SetChoosenHeros`
    (aus `currentGame-action.ts` übernehmen oder in eine neue `lobby-action.ts` verschieben —
    letzteres ist konsistenter mit dem restlichen Actions/States-Naming-Schema).
  - `CurrentGameState` verliert die beiden Reducer und das `choosenHeros`-Feld aus
    `CurrentGameModel`; `CurrentGameData.setGameData()` schreibt `choosenHeros` nicht mehr mit.
  - `CurrentGameSelectors.currentPlayers` wird zu `LobbySelectors.currentPlayers`, liest aus
    `LobbyState`. **Wichtig:** in `app.config.ts:27` den neuen State zu `provideStore([...])`
    hinzufügen — sonst wiederholt sich der `MobState`-Fehler (nicht registrierter State, siehe
    `docs/done/review-2026-08/01-state-management.md`, Befund 1).
  - `startscreen.component.ts` und `player-hand.component.ts` (Dispatch von
    `SetChoosenHeros`/`updateChoosenHeros`) auf den neuen Selector/Actions-Import umstellen.
  - Verifikation: `ng build`, `ng test`, manueller Test „zweiter Spieler tritt Spiel bei,
    Heldenliste aktualisiert sich bei allen Clients".

- [ ] **TODO 2 — `EncounterState` abspalten (Gegner/Mob/Boss)**
  - Neue Datei `src/app/states/encounter-state.ts`: `EncounterModel { currentEnemy: Mob,
    currentBoss: Mob, Mob: Mob[], allBosses: Mob[] }`, Actions `UpdateMonsterTokenArray`/
    `SetNewEnemy`/`UpdateMobAction` (letztere aktuell in `MonsterStack-action.ts` — Datei
    entsprechend umbenennen oder Action dorthin migrieren, je nachdem was zum Zeitpunkt der
    Umsetzung weniger Importe bricht).
  - `CurrentGameSelectors.currentEnemy`/`currentMob`/`currentBoss` werden zu
    `EncounterSelectors.*`.
  - Hier ist die größte Zahl an Aufrufstellen betroffen: `PlayerHandComponent` (mehrfach,
    u.a. `player-hand.component.ts:72-78`, `:138-141`), `HeropowerContainerComponent`
    (`heropower-container.component.ts:27,42`), `GameComponent`, `StartscreenComponent`.
    Systematisch durchgehen, nicht per blindem Suchen-Ersetzen (TypeScript deckt vergessene
    Importe zuverlässig als Build-Fehler auf).
  - `app.config.ts` registrieren.
  - Verifikation: `ng build`, `ng test`, manueller Test „Karte spielen, Gegner besiegen, neuer
    Gegner/Boss lädt nach" (der Kernspielloop, hängt vollständig an diesem State).

- [ ] **TODO 3 — Rest-`CurrentGameState` auf Metadaten + Quest-Flag reduzieren**
  - Übrig bleibt `CurrentGameModel { items: string, numberOfPlayers, gameId, difficulty,
    isLost, questCardActivated }` mit `CurrentGameAction`/`CurrentGameData`/
    `updateQuestCardActivated`.
  - Klären, ob `questCardActivated` hierbleibt (kleinstes verbleibendes Feld ohne eigenen
    fachlichen Bereich) oder — falls in Zukunft weitere Quest-Karten-Flags dazukommen — ein
    eigener `QuestState` wird. Für den aktuellen Umfang (ein Boolean) reicht Verbleib in
    `CurrentGameState`.
  - `CurrentGameData.setGameData()` klären: nach TODO 1/2 enthält der volle `Game`-Datensatz
    aus Firestore weiterhin alle Felder (`choosenHeros`, `currentEnemy`, `Mob`, ...), auch wenn
    sie jetzt in getrennten States leben. Entweder `setGameData()` dispatcht intern zusätzlich
    `SetChoosenHeros`/`SetNewEnemy`/`UpdateMobAction` an die neuen States (ein Action löst
    mehrere State-Updates aus — NGXS unterstützt das über mehrere `@Action`-Handler auf
    dieselbe Action-Klasse in verschiedenen States), oder `PlayerHandComponent.
    updateFromDatabase()` dispatcht ohnehin bereits gezielt (`:139-143`) und `CurrentGameData`
    wird nur noch für den Metadaten-Teil gebraucht — dann `CurrentGameData`s Payload-Typ auf nur
    noch die Metadaten-Felder einschränken. **Diese Entscheidung vor der Umsetzung von TODO 3
    treffen**, sie bestimmt, ob die in Befund 2b beschriebene Race Condition (späterer
    `CurrentGameData`-Dispatch setzt aktuellere Teilzustände zurück) strukturell aufgelöst wird
    oder nur verlagert.
  - Verifikation: `ng build`, `ng test`, `npm run test:rules` (Firestore-Datenstruktur selbst
    ändert sich nicht, nur die NGXS-Aufteilung — Rules sollten unberührt bleiben, trotzdem
    gegenprüfen).

- [ ] **TODO 4 — Abschluss-Smoke-Test**
  - Zwei-Browser-Test wie in `docs/done/onpush-refactor-plan.md` empfohlen: Spiel erstellen,
    zweiter Spieler tritt bei, Karte spielen, Heropower auslösen, Boss erreichen. Deckt alle
    drei neuen States gemeinsam ab.

## Verifikation (gesamter Plan)

- `ng build` und `ng test --watch=false --browsers=ChromeHeadlessCI` nach jedem TODO grün.
- `npm run test:rules` nach TODO 3 (Firestore-Struktur-Check).
- Manueller Zwei-Browser-Smoke-Test vor dem finalen Merge (TODO 4).

## Nicht im Scope

- Die generische `FirestoreRepositoryService`-Einführung (paralleler, unabhängiger Plan) — die
  States lesen/schreiben weiterhin über die bestehenden (oder in jenem Plan konsolidierten)
  Services; dieser Plan ändert nur die NGXS-Struktur, nicht den Firestore-Zugriff selbst.
- Vereinheitlichung von `ctx.setState(...)` vs. `ctx.patchState(patch<Model>(...))` über alle
  States hinweg (Befund 4 in `docs/done/review-2026-08/01-state-management.md`, nice-to-have,
  unabhängig von der Aufteilung).

## Referenzen

- `docs/done/review-2026-08/01-state-management.md` — vollständige Befundliste (Befund 2/2b
  sind hier relevant; Befund 1/3/6/9 bereits in PR #21 erledigt).
- `src/app/selectors/currentGame-selector.ts` — aktuelle Selector-API, die pro TODO erhalten
  bzw. sauber aufgeteilt werden muss.
- `docs/done/onpush-refactor-plan.md` — Referenzstil für Diagnose/TODOs/Verifikation.
