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
