<!--
  Gesammelte offene TODOs aus allen CLAUDE.md-Dateien im Projekt (Root + verzeichnis-lokal)
  und den zugehörigen Plänen unter docs/planned/ bzw. docs/done/*-Status-Abschnitten.
  Erstellt am 2026-09-05, aktualisiert am 2026-09-05 (Nachtrag): drei Pläne
  (currentGame-state-split, mobile-native-feel, singleplayer-mode) sind inzwischen vollständig
  umgesetzt und nach docs/done/ verschoben, alle drei ausstehenden manuellen Smoke-Tests wurden
  von Patrick durchgeführt und bestätigt. Diese Datei wird nicht automatisch aktuell gehalten —
  bei Bearbeitung eines Punktes hier auch die jeweilige Quelle (Plan/CLAUDE.md) nachziehen, nicht
  nur diese Liste abhaken.
-->

# To-Do — offene Punkte aus den CLAUDE.md-Dateien

## Echte, noch offene Code-/Spielregel-Punkte

1. **"Hinterhalt"-Ereigniskarte** (`docs/done/five-minute-dungeon-rules-plan.md` TODO 9) —
   Zwei-Karten-Reveal-Mechanismus nicht umgesetzt, Karte bleibt in
   `src/models/monster/monster-collection.data.ts` auskommentiert. Der Encounter-Loop kennt
   aktuell nur einen `currentEnemy` nach dem anderen.
2. **Zweite Verlustbedingung** ("Gruppe kann die geforderten Symbole nicht mehr aufbringen",
   `docs/done/five-minute-dungeon-rules-plan.md` TODO 11) — bewusst nicht umgesetzt, nur die
   erste Verlustbedingung (Hand-/Nachzieh-/Ablagestapel gleichzeitig leer) existiert
   (`CardPlayService.checkHandDeadlockLoss()`).
3. **`LocalSaveMigrationService.migrateAll()` ohne "bereits migriert"-Flag**
   (`src/app/services/CLAUDE.md`) — ein erneuter Aufruf (z.B. nach einem Teilfehlschlag) würde
   bereits migrierte lokale Spielstände ein zweites Mal als neue Firestore-Spiele anlegen
   (Duplikate). Bekannte Einschränkung, nicht behoben.
4. **`StartscreenComponent.logout()`** ist weiterhin nicht ins In-Game-Menü verschoben
   (`src/app/components/game-menu/CLAUDE.md`) — im Zielbild des Login-Umbaus vorgesehen, aber
   ohne gesonderten Auftrag bewusst nicht angegangen.

## Externe/manuelle Konfiguration (kein Code-Task)

5. **Firestore-TTL-Policy** auf `users/{uid}` und `games/{gameId}/player/{playerId}`
   (`src/app/services/CLAUDE.md`, Issue #77 PR 5) — muss einmalig in der Firebase Console für
   das Projekt `hero-dungeon` eingerichtet werden (oder per `gcloud firestore fields ttls
   update`), damit die 7-Tage-Ablauf-Löschung tatsächlich greift. Noch nicht konfiguriert.

## Findings aus Portfolio-/Code-Review (2026-09-05, Recruiter-Perspektive)

Kein aktiver Umsetzungsplan im Sinne von `docs/CLAUDE.md` — Backlog-Übersicht aus einer
externen Code-Review-Perspektive. Bei Umsetzung von Punkt 6 vor Beginn mit Patrick abstimmen
(betrifft Kernregeln) und in kleinen Schritten vorgehen (Referenz:
`docs/done/onpush-refactor-plan.md`).

6. **`card-play.service.ts` refactorn** (war 859 Zeilen, größte Datei im Repo) — God-Service mit
   ~40 privaten Hilfsmethoden für die Kartenregeln, Auswahl der Karten-Logik lief über lange
   `if (card === 'x')`-Ketten statt über ein Strategy-Pattern oder eine Lookup-Table.
   **Erster Teil erledigt (TDD, 2026-09-05/06):** alle fünf Sonderkarten ohne Zielspieler-Auswahl
   (`magischeBombe`, `joker`, `heiligeHandgranate`, `göttlicherSchild`, `heiltrank`) sind als
   eigene, unabhängig testbare `CardEffect`-Klassen unter `src/app/services/card-effects/`
   extrahiert (`CardEffect { apply(ctx, playerId, card, currHand) }` mit schmalem
   `CardEffectContext`-Interface), aufgelöst über eine `cardEffects`-Lookup-Map statt der
   bisherigen `if`-Zweige — `chooseCard()` hat für diese fünf Karten keine `if (card === 'x')`-
   Zweige mehr. Bestehende `card-play.service.spec.ts` (15 Fälle) unverändert grün, volle Suite
   jetzt 188 Tests. Details: `src/app/services/CLAUDE.md`.
   **Zweiter Teil erledigt (TDD, 2026-09-06, Component-Refactoring-Audit T5):**
   `continueToNextDungeon()`/`restartCampaign()`/`reshuffleAllPlayersForNewDungeon()`/
   `reshufflePlayerHeroDeck()`/`getNextEnemy()`/`getNextBoss()` (~130 Zeilen) in einen neuen
   `DungeonProgressionService` extrahiert (eigene Tests zuerst geschrieben, dann Implementierung,
   dann `CardPlayService` auf dünne Delegations-Methoden umgestellt) — 797 → 696 Zeilen. Volle
   Suite jetzt 195 Tests. Details: `src/app/services/CLAUDE.md`.
   - [x] Fünf Kartenwirkungen ohne Zielspieler-Auswahl in Strategie-Klassen ausgelagert
   - [x] Card-Typ → Strategie-Zuordnung über eine Lookup-Map statt `if`/`switch`-Ketten aufgelöst
   - [x] Boss-/Dungeon-Übergang (`continueToNextDungeon`/`restartCampaign`/`getNextEnemy`/
     `getNextBoss`) in `DungeonProgressionService` extrahiert
   - [ ] **Noch offen:** die fünf Zielspieler-Karten (Spende, Stehlen, Heilkräuter, Wut, Heilung)
     bleiben laut Abstimmung mit Patrick bewusst eigenständige öffentliche `resolve*()`-Methoden
     (andere Aufrufkonvention — direkt von `PlayerHandComponent` nach Dialog-Auswahl). Die drei
     separaten `bumpStat`-Implementierungen (`card-play.service.ts`/`heropower.service.ts`/
     `dieb.service.ts`) wurden im Zuge dieses Refactorings nicht angefasst — laut CLAUDE.md
     bewusst getrennt gehalten, siehe dortige Begründung, kein akuter Handlungsbedarf
   - [ ] **Noch offen:** `card-play.service.ts` ist mit 696 Zeilen weiterhin über der
     400-Zeilen-Richtlinie — verbleibender Cluster (`drawCards`/`checkHandsize`/
     `persistPlayerStacks`/`checkHandDeadlockLoss` + die 8 "andere Spieler ziehen/zurückholen"-
     Methoden, ~150 Zeilen) ist deutlich enger mit dem Rest der Datei verwoben (auch von den
     Zielspieler-`resolve*()`-Methoden genutzt) — bei Aufgriff wieder zuerst mit Patrick
     abstimmen, siehe Begründung in der Session vom 2026-09-06
   - Die drei separaten `bumpStat`-Implementierungen (`card-play.service.ts`,
     `heropower.service.ts`, `dieb.service.ts`) im Zuge dessen neu bewerten — aktuell laut
     `src/app/services/CLAUDE.md` bewusst getrennt gehalten
   - Bestehende Tests aus `card-play.service.spec.ts` (15 Fälle inkl. Bug-/TODO-Referenzen)
     unverändert grün halten — reine Struktur-, keine Verhaltensänderung
   - Nach vollständiger Aufteilung `src/app/services/CLAUDE.md` aktualisieren (God-Service-
     Hinweis entfernen)
7. **`inject()` statt Constructor-DI konsequent durchziehen** (Issue #94) — betroffen u.a.
   `player-hand.component.ts` und `game.component.ts`, die trotz Root-CLAUDE.md-Vorgabe noch
   Constructor-DI nutzen.
8. **Firestore-Direktzugriffe aus `game.component.ts`** (`checkIfPlayerIsAlreadyPartOfGame`,
   `drawInitialHand`) in einen Service auslagern, statt sie direkt in der Komponente zu halten
   (passend zur etablierten Repository-/Business-Logik-Trennung).
9. **README für externe Betrachter** — ~~von Angular-CLI-Boilerplate auf echtes Projekt-README
   umgestellt (Beschreibung, Live-Demo-Link, Tech-Stack, Architektur-Highlights, Setup)~~
   erledigt 2026-09-05. Noch offen: Screenshot(s)/GIF vom Spielbrett und von der
   Handkarten-Ansicht ins README einfügen (Platzhalter-Kommentar ist gesetzt).

## Erledigt (2026-09-05)

Alle bei der ersten Prüfung offenen manuellen Smoke-Tests sind durchgeführt und bestätigt, die
zugehörigen Pläne wurden entsprechend aktualisiert und nach `docs/done/` verschoben:

- Zwei-Browser-Multiplayer-Smoke-Test — `docs/done/currentGame-state-split-plan.md` TODO 4.
- Voller manueller Multiplayer-Smoke-Test mit echtem Firebase-Login —
  `docs/done/responsive-design-plan.md`.
- Realgeräte-Test für Handkarten-Bottom-Leiste — `docs/done/mobile-native-feel-plan.md` TODO 7.

Außerdem als vollständig umgesetzt bestätigt und die jeweilige Doku korrigiert:

- `docs/done/mobile-native-feel-plan.md` — TODO 8 (Querformat) sowie alle fünf
  Stufe-B-Ideenlisten-Punkte (#48 Kartenstapel-Zähler, #49 Heropower-FAB, #50 Enemy-Card
  kollabierbar, #51 Haptik, #52 Swipe-Geste) sind im Code vorhanden, Plan-Status entsprechend
  aktualisiert.
- `docs/done/singleplayer-mode-plan.md` — alle vier PRs (Solo-Spiel im bestehenden Modell,
  Deck-Cycling/Deadlock-Schutz, eigener Singleplayer-Einstieg, Siegzustand, echter
  Offline-Singleplayer) umgesetzt, Status-Abschnitt ergänzt.
- Drei stale Code-Kommentare (`game-menu.component.ts`, `local-singleplayer-save.service.ts`,
  `user.class.ts`) verwiesen noch auf `docs/planned/login-multiplayer-onboarding-plan.md` —
  korrigiert auf `docs/done/...`.
- Root-`CLAUDE.md` ("Bekannte Baustellen") und die referenzierenden verzeichnis-lokalen
  `CLAUDE.md`-Dateien (`src/app/states/CLAUDE.md`, `src/models/CLAUDE.md`,
  `src/app/services/CLAUDE.md`) auf die neuen `docs/done/`-Pfade aktualisiert.

`docs/planned/` ist damit aktuell leer — kein Plan im Projekt wartet mehr auf Umsetzung, bis auf
die beiden echten Code-Punkte 1/2 oben (die als Teil eines bereits abgeschlossenen Plans bewusst
zurückgestellt sind, siehe dort).
