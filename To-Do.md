<!--
  Gesammelte offene TODOs aus allen CLAUDE.md-Dateien im Projekt (Root + verzeichnis-lokal)
  und den zugehörigen Plänen unter docs/planned/ bzw. docs/done/*-Status-Abschnitten.
  Erstellt am 2026-09-05 durch vollständige Prüfung, welche dort erwähnten Punkte laut Code/
  anderen CLAUDE.md-Dateien bereits umgesetzt sind. Diese Datei wird nicht automatisch aktuell
  gehalten — bei Bearbeitung eines Punktes hier auch die jeweilige Quelle (Plan/CLAUDE.md)
  nachziehen, nicht nur diese Liste abhaken.
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

## Offene Verifikations-/Smoke-Test-Schritte (kein Feature-Code, aber als TODO markiert)

6. **Zwei-Browser-Multiplayer-Smoke-Test** für den `currentGame-state.ts`-Split
   (`docs/planned/currentGame-state-split-plan.md`, TODO 4) — Spiel erstellen, zweiter Spieler
   tritt bei, Karte spielen, Heropower auslösen, Boss erreichen. In der Agent-Sandbox mangels
   Firebase-Zugriff nicht durchführbar.
7. **Voller manueller Multiplayer-Smoke-Test mit echtem Firebase-Login**
   (`docs/done/responsive-design-plan.md`) — insbesondere: Heropower-Overlay darf Handkarten auf
   schmalen Screens nicht verdecken, Kartenstapel-Deko darf mit Handkarten nicht kollidieren.
8. **Realgeräte-Test für Handkarten-Bottom-Leiste** (`docs/planned/mobile-native-feel-plan.md`,
   TODO 7) — Heropower-Icon-Antippbarkeit direkt über der Leiste, Verhalten von
   `.color-effect`-Rahmen kombiniert mit Fächer-Rotation, auf einem echten Gerät noch nicht
   verifiziert.

## Dokumentations-Befund (kein Code-TODO, aber Doku ist veraltet)

Bei der Prüfung wurde festgestellt, dass mehrere als "offen" dokumentierte Punkte im Code bereits
umgesetzt sind — die jeweilige `CLAUDE.md`/der Plan wurde nur nicht nachgezogen:

- `docs/planned/mobile-native-feel-plan.md` listet Issues **#47** (Querformat-Kompaktlayout),
  **#48** (Kartenstapel-Zähler-Badge), **#49** (Heropower-FAB), **#50** (Enemy-Card
  kollabierbar) und **#51** (Haptisches Feedback) noch als offen. Alle fünf sind laut Code
  bereits vorhanden: `@media (orientation: landscape) and (max-height: 500px)` in vier
  SCSS-Dateien, `.card-stack-badge` in `player-hand.component.html`, `.heropower-fab` in
  `heropower.component.ts`, `descriptionExpanded` in `enemy.component.ts`, `vibrate()`-Aufrufe
  in `player-hand.component.ts`/`hand-cards.component.ts`/`heropower.component.ts`. Nur **#52**
  (Swipe-Geste) ist im Plan selbst schon korrekt als "umgesetzt (PR #45)" vermerkt — aber der
  Status-Kopf des Plans nennt weiterhin "TODO 8 (Querformat) weiterhin offen", was der Code
  widerlegt.
- `docs/planned/singleplayer-mode-plan.md` ist inhaltlich komplett überholt: PR 1 (1 Spieler
  erlaubt), PR 1b (Deck-Cycling/Deadlock-Schutz), PR 2 (eigener Singleplayer-Einstieg), PR 3
  (Siegzustand `gameStatus`) und PR 4 (echter Offline-Singleplayer) sind laut
  `src/app/services/CLAUDE.md`/`src/app/components/game/CLAUDE.md`/
  `docs/done/login-multiplayer-onboarding-plan.md` alle umgesetzt. Der Plan sollte nach
  `docs/done/` verschoben und mit einem aktuellen Status-Abschnitt versehen werden
  (Root-`CLAUDE.md`s Pflicht zur `CLAUDE.md`-Pflege).

**Empfehlung:** Vor der nächsten Arbeit an einem der oben genannten Punkte kurz den jeweiligen
Plan/die CLAUDE.md aktualisieren, damit diese Liste nicht selbst sofort wieder veraltet.
