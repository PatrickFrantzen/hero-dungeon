# Plan: Interaktives Tutorial

## Status (2026-09-01)

**PR 1 (Tutorial-Infrastruktur) ist umgesetzt** — siehe `src/app/components/tutorial/CLAUDE.md`
für den Code-Stand. `TutorialState`/`TutorialSelectors`/`tutorial-action.ts` existieren und sind
in `app.config.ts` registriert, `TutorialOverlayContainerComponent`/`TutorialOverlayComponent`
sind global in `app.component.html` eingehängt, Spotlight-Highlight + Abdunklung + Weiter/
Zurück/Überspringen funktionieren mit einer Platzhalter-Schrittliste (`tutorial-steps.data.ts`).
Manueller Hilfe-Button auf `StartscreenComponent`. `ng build`/`ng test` grün (54/54).

**PR 2 (Inhalt Startscreen/Heldenauswahl) ist umgesetzt** — `tutorial-steps.data.ts` enthält
fünf echte Schritte für Station 1+2 (Startscreen-Überblick, Singleplayer, Multiplayer erstellen/
beitreten, Heldenauswahl inkl. Solo-Empfehlung Dieb/Waldläufer), `startscreen.component.html`
hat dafür stabile `id`s (`#tutorial-target-singleplayer`, `#tutorial-target-multiplayer`)
bekommen. Details: `src/app/components/tutorial/CLAUDE.md`.

**Noch offen:** PR 3–4 (echte Schrittinhalte für Station 3–7: Dungeon-Timer, Encounter,
Handkarten, Heldenfähigkeit, Sieg/Niederlage) und PR 5 (Auto-Trigger beim ersten
Singleplayer-Spiel) — siehe PR-Schnitt unten, an den Design-Entscheidungen hat sich nichts
geändert.

## Referenzen

[Issue #54](https://github.com/PatrickFrantzen/hero-dungeon/issues/54) — Interaktives Tutorial
planen und umsetzen.

## Ist-Zustand

Es gibt aktuell **keinerlei Onboarding**. Ein neuer Spieler landet nach Login direkt auf
`StartscreenComponent` (`src/app/components/startscreen/startscreen.component.ts`) und danach,
je nach gewähltem Modus, in `GameComponent` — dort läuft der Dungeon-Countdown-Timer erst los,
sobald die erste Karte wirksam gespielt wird (`CardPlayService.ensureGameTimerStarted()`, siehe
`src/app/components/game/CLAUDE.md`), aber alle Regeln (Symbol-Matching, Handkartengröße,
Heldenfähigkeiten, Rasten im Singleplayer) muss der Spieler bereits kennen. Es existiert keine
Hilfe-/Regel-Seite, kein Tooltip, keine geführte erste Runde.

Relevante Einstiegspunkte, die ein Tutorial abdecken müsste:

1. **Startscreen** (`startscreen.component.html`) — Singleplayer vs. Multiplayer, Spiel
   erstellen/beitreten.
2. **Heldenauswahl** (`DialogChooseHeroComponent`) — welcher Held passt zu welchem Spielstil,
   Solo-Empfehlungen (`Dieb`, `Waldläufer`, siehe `docs/planned/singleplayer-mode-plan.md`).
3. **Dungeon-Timer** (`game.component.html`, `.game-timer`) — 5-Minuten-Countdown, startet mit
   der ersten Karte, kann durch Magier/Göttlichen Schild pausiert werden.
4. **Gegner/Encounter** (`EnemyContainerComponent`) — Symbol-Matching-Prinzip: welche Handkarte
   passt zu welchem Encounter-Token.
5. **Handkarten spielen** (`player-hand.component.html`, `.currentHandStack`) — Klick auf Karte,
   Nachziehen bis max. Handgröße, im Singleplayer zusätzlich "Rasten".
6. **Heldenfähigkeit** (`app-heropower-container`) — Cooldown/Aktivierung, Sonderfälle (Magier
   pausiert den Timer, Zielspieler-Auswahl bei Spende/Stehlen/Heilkräuter/Wut/Heilung).
7. **Sieg/Niederlage/Boss-Bestätigung** (`.game-prompt`, `.game-success`) — Boss besiegt →
   Bestätigungsdialog für nächsten Dungeon, Zeit abgelaufen → Niederlage mit Neustart-Option.

## Zielbild

Ein **interaktives In-Game-Tutorial**, das die oben genannten sieben Stationen als geführte
Schritt-Sequenz erklärt — mit echten oder tutorial-eigenen simulierten Spieldaten, nicht nur
Fließtext. Zwei Trigger:

- **Automatisch** beim ersten Spiel eines Accounts (einmalig, dann nicht mehr aufdringlich).
- **Manuell** jederzeit abrufbar über einen sichtbaren Hilfe-Einstiegspunkt (Startscreen und/
  oder Spielbildschirm).

## Design-Entscheidungen

### 1. Persistenz des "Tutorial gesehen"-Zustands

`app.config.ts` registriert bereits `withNgxsStoragePlugin({ keys: '*' })` — der komplette NGXS-
Store wird automatisch in `localStorage` gespiegelt (siehe `src/app/states/CLAUDE.md`). Ein
neuer `TutorialState` mit einem Feld wie `hasSeenTutorial: boolean` bekommt diese Persistenz
**kostenlos** mit, ohne eigenen `localStorage`-Zugriff oder eine Firestore-Schemaänderung.

- **Empfehlung:** eigener `TutorialState` (`src/app/states/tutorial-state.ts`), analog zu
  Lobby-/Encounter-State als eigene fachliche Verantwortlichkeit (siehe
  `src/app/states/CLAUDE.md`, "Neue States/Actions folgen demselben Dreiklang"). Persistiert
  geräte-lokal (`localStorage`), nicht pro Account in Firestore — bewusster Trade-off: ein
  Spieler, der sich auf einem zweiten Gerät einloggt, sieht das Tutorial dort erneut. Für ein
  reines Onboarding-Signal (kein Spielzustand mit Konsistenzanspruch) akzeptabel; falls
  Cross-Device-Konsistenz gewünscht ist, wäre stattdessen ein Feld im Firestore-`user`-Dokument
  nötig (eigener Diagnoseschritt, hier nicht mitgelöst).

### 2. Aufbau der Tutorial-Komponente

- Eine generische `TutorialOverlayComponent` (Signal-basiert, `OnPush`), die eine Liste von
  Schritten (`title`, `body`, optionales `targetSelector` fürs Hervorheben eines echten
  UI-Elements, optionale `route`) durchläuft — kein Text-only-Modal, sondern ein Overlay, das
  über dem echten UI liegt und einzelne Elemente (Timer, Handkarte, Heropower-Icon) per
  CSS-Highlight (Rahmen/Spotlight) markiert, während der Rest abgedunkelt ist.
- Schritt-Inhalte werden als reines Datenarray definiert (z.B.
  `src/app/components/tutorial/tutorial-steps.data.ts`), nicht acht einzelne Komponenten —
  analog zum bestehenden `monster-collection.data.ts`-Muster für Spieldaten.
- Steuerung über `TutorialState`/`TutorialAction`en (`StartTutorial`, `NextTutorialStep`,
  `SkipTutorial`, `CompleteTutorial`) statt lokalem Komponenten-Flag, damit der Fortschritt bei
  einem Reload nicht verloren geht (Spieler navigiert währenddessen ggf. zwischen Startscreen
  und Spiel).

### 3. Umgang mit Multiplayer-Realtime-Daten

Die Schritte 3–7 (Timer, Encounter, Handkarten, Heropower, Sieg/Niederlage) hängen an echtem
Spielzustand, der im Multiplayer von Mitspielern verändert wird. Für ein **stabiles** Tutorial,
das nicht durch Mitspieler-Aktionen kaputtgeht:

- **Empfehlung:** Tutorial startet automatisch nur im **Singleplayer**-Einstieg (dort ist der
  Spieler alleiniger Akteur, Encounter-Reihenfolge deterministisch). Ein Multiplayer-Spieler,
  der noch nie ein Spiel gestartet hat, sieht auf dem Startscreen denselben manuellen
  Hilfe-Button, landet damit aber im selben (Singleplayer-)Tutorial-Ablauf, unabhängig davon, ob
  er später Multiplayer spielt — die Spielregeln (Symbol-Matching, Handkarten, Heropower) sind
  modusübergreifend identisch, nur "Rasten" ist Singleplayer-exklusiv (`isSingleplayer()`-Guard
  in `player-hand.component.html`) und wird im Tutorial entsprechend als Singleplayer-Zusatz
  erklärt, nicht als allgemeine Regel.

## PR-Schnitt

### PR 1 — Tutorial-Infrastruktur (Grundgerüst, noch ohne Inhalt)

- `src/app/actions/tutorial-action.ts`: `StartTutorial`, `NextTutorialStep`, `PreviousTutorialStep`,
  `SkipTutorial`, `CompleteTutorial`.
- `src/app/states/tutorial-state.ts`: `TutorialState` mit `{ hasSeenTutorial: boolean, active:
  boolean, currentStepIndex: number }`, Registrierung in `app.config.ts`.
- `src/app/selectors/tutorial-selector.ts`: `isTutorialActive`, `currentTutorialStep`,
  `hasSeenTutorial`.
- `src/app/components/tutorial/tutorial-overlay/` (Container + Presenter, analog zum
  Smart/Dumb-Muster aus `enemy/`/`heropower/`, siehe `src/app/components/CLAUDE.md`):
  Abdunklung, Spotlight auf `targetSelector` (per `document.querySelector` + `getBoundingClientRect`,
  signal-getrieben über `effect()`), Weiter/Zurück/Überspringen-Buttons, Fortschrittsanzeige
  ("Schritt 3 von 7").
- Noch **keine** echten Inhalte — Platzhalter-Schrittliste (2–3 Dummy-Schritte) zur Verifikation
  von Overlay/Highlight/Navigation.
- Manueller Hilfe-Button auf `StartscreenComponent` (`(click)="store.dispatch(new
  StartTutorial())"`), sichtbar unabhängig vom `hasSeenTutorial`-Flag.
- Verifikation: `ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI`, manueller Check
  (Hilfe-Button öffnet Overlay, Weiter/Zurück/Überspringen funktionieren, Overlay schließt sich
  bei `CompleteTutorial`/`SkipTutorial`).

### PR 2 — Inhalt Schritt 1–2 (Startscreen, Heldenauswahl)

- Echte Schrittinhalte für Startscreen-Erklärung (Singleplayer vs. Multiplayer, Spiel
  erstellen/beitreten) und Heldenauswahl (Solo-Empfehlung `Dieb`/`Waldläufer`, allgemeine
  Heldenübersicht).
- `targetSelector`e auf echte DOM-Elemente in `startscreen.component.html` (Buttons brauchen
  dafür stabile `id`s/Klassen, falls noch nicht vorhanden).
- Verifikation wie PR 1, zusätzlich visueller Check der Highlight-Positionierung bei
  unterschiedlichen Viewport-Größen (Desktop + mobiles Preset, siehe
  `docs/planned/mobile-native-feel-plan.md` zur bestehenden Responsive-Basis).

### PR 3 — Inhalt Schritt 3–5 (Dungeon-Timer, Encounter, Handkarten)

- Schritte für `.game-timer`, `EnemyContainerComponent`/Encounter-Token, `.currentHandStack`
  (Symbol-Matching-Prinzip: welches Symbol auf der Handkarte passt zu welchem Token).
- Da diese Schritte an echten (im Singleplayer deterministischen) Spieldaten hängen: Tutorial
  läuft parallel zu einem laufenden Singleplayer-Spiel, pausiert aber keine echte Spiellogik —
  der Spieler kann während des Tutorials weiterspielen, das Overlay verfolgt nur mit
  (kein separater "Tutorial-Modus" mit Fake-Daten, um keinen zweiten Spielzustand pflegen zu
  müssen).
- Verifikation wie PR 2, zusätzlich manueller Smoke-Test: Tutorial während laufendem
  Singleplayer-Spiel durchklicken, dabei parallel eine Karte spielen — Overlay darf nicht
  hängen bleiben oder den Encounter-State verfälschen.

### PR 4 — Inhalt Schritt 6–7 (Heldenfähigkeit, Sieg/Niederlage/Boss-Bestätigung)

- Schritte für `app-heropower-container` (Grundprinzip, Verweis auf heldenspezifische
  Fähigkeit ohne alle vier Varianten einzeln durchzuspielen) und die
  Bestätigungs-/Endzustände (`.game-prompt`, `.game-success`, siehe
  `src/app/components/game/CLAUDE.md`, Abschnitt "Bestätigungs-Flow").
- Letzter Schritt dispatcht `CompleteTutorial` → `hasSeenTutorial: true`.
- Verifikation wie PR 3.

### PR 5 — Auto-Trigger beim ersten Spiel

- `GameComponent.ngOnInit()` (oder `checkIfPlayerIsAlreadyPartOfGame()`, nach erfolgreichem
  Laden): wenn `numberOfPlayers === 1` (Singleplayer, siehe Design-Entscheidung 3) und
  `!hasSeenTutorial()`, `StartTutorial` dispatchen.
- Kein Auto-Trigger im Multiplayer-Einstieg (siehe Design-Entscheidung 3) — dort bleibt nur der
  manuelle Hilfe-Button.
- Verifikation: `ng build`, `ng test`, manueller Smoke-Test mit geleertem `localStorage`
  (neuer "Erstspieler"): erstes Singleplayer-Spiel startet automatisch das Tutorial, zweites
  Spiel nicht mehr; Hilfe-Button startet es jederzeit erneut, unabhängig vom Flag.

## Verifikation (gesamt, nach letztem PR)

- `ng build` und `ng test --watch=false --browsers=ChromeHeadlessCI` grün.
- Manueller Smoke-Test der vollständigen Sequenz: neuer Account → Startscreen-Hilfe-Button →
  alle 7 Schritte durchklicken (inkl. Zurück-Navigation) → Überspringen-Funktion separat testen
  → Tutorial im laufenden Singleplayer-Spiel erneut über Hilfe-Button öffnen.
- Kein Firestore-Rules-Impact (rein clientseitiger/`localStorage`-Zustand) — `npm run
  test:rules` nur zur Kontrolle, falls doch Firestore-Felder ergänzt werden (Design-Entscheidung
  1, Cross-Device-Variante).
