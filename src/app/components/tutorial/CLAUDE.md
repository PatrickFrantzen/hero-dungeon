# tutorial/ — Interaktives Onboarding-Overlay

Umsetzung von [Issue #54](https://github.com/PatrickFrantzen/hero-dungeon/issues/54) nach
`docs/done/tutorial-plan.md` — **vor jeder Änderung hier zuerst den Status-Abschnitt in
diesem Plan lesen** (alle 5 geplanten PRs sind mittlerweile umgesetzt, Details unten).

## Aufbau (PR 1–5: vollständig umgesetzt)

- **`tutorial-steps.data.ts`** — reines Datenarray (`TutorialStep[]`, Felder `title`/`body`/
  optional `targetSelector`), analog zum `monster-collection.data.ts`-Muster. Enthält zehn echte
  Schritte für alle sieben Stationen (Startscreen-Überblick, Singleplayer, Multiplayer
  erstellen/beitreten, Heldenauswahl, Dungeon-Timer, Encounter-Symbole, Handkarten,
  Heldenfähigkeit, Sieg/Niederlage/Boss-Bestätigung, Abschluss-Hinweis) — nur PR 5
  (Auto-Trigger) fehlt noch.
- Die `targetSelector`e für Station 1+2 (`#tutorial-target-singleplayer`,
  `#tutorial-target-multiplayer`) sitzen als stabile `id`s in `startscreen.component.html`
  (Singleplayer-Button bzw. ein umschließendes `<div>` um Multiplayer-Button + Join-Input +
  Join-Button). Die Heldenauswahl-Schritte haben **bewusst keinen** `targetSelector`:
  `DialogChooseHeroComponent` ist zu diesem Zeitpunkt nicht geöffnet (Tutorial startet nur vom
  Startscreen aus), ein `document.querySelector()` würde ins Leere laufen und das Overlay fällt
  auf Volldimmung ohne Ausschnitt zurück (siehe `TutorialOverlayComponent.spotlightRect`-Fallback
  unten).
- Die `targetSelector`e für Station 3–5 (`.game-timer`, `.current-Enemy`, `.currentHandStack`)
  sind **bestehende** Klassen aus `game.component.html`/`enemy.component.html`/
  `player-hand.component.html` — keine neuen `id`s nötig, im Unterschied zu Station 1+2. Diese
  Elemente existieren nur, während `GameComponent` gemountet ist (laufendes Spiel); öffnet ein
  Spieler das Tutorial auf dem Startscreen und klickt bis zu diesen Schritten durch, bevor ein
  Spiel läuft, dimmt das Overlay auch hier nur den ganzen Screen (derselbe Fallback wie bei der
  Heldenauswahl). Weil `.tutorial-overlay` selbst `pointer-events: none` ist, bleiben die
  Startscreen-Buttons dahinter klickbar — ein Spieler kann also mit offenem Tutorial-Overlay ein
  Singleplayer-Spiel starten und sieht die Timer-/Encounter-/Handkarten-Schritte dann live mit
  Spotlight auf den echten Elementen (kein separater Tutorial-Modus mit Fake-Daten, siehe
  Design-Entscheidung 3 im Plan).
- Der `targetSelector` für Station 6 (`.heropower-fab`, `heropower.component.html`) folgt
  demselben Muster wie Station 3–5 — der FAB ist immer sichtbar, solange `PlayerHandComponent`
  gerendert ist (nicht bei `bossDefeated`/`lost`, siehe `game.component.html`). Station 7
  (Sieg/Niederlage/Boss-Bestätigung) hat **bewusst keinen** `targetSelector`: `.game-prompt`/
  `.game-success` existieren nur in den seltenen `bossDefeated`/`won`/`lost`-Zuständen — statt
  auf einen Zustand zu warten, der beim Durchklicken des Tutorials i.d.R. nicht vorliegt, erklärt
  dieser Schritt den Ablauf rein textuell (derselbe Volldimmung-Fallback wie bei der
  Heldenauswahl).
- **`tutorial-overlay/tutorial-overlay-container/tutorial-overlay-container.component.ts`** —
  Container (Smart/Dumb-Muster wie `enemy/`/`heropower/`, siehe
  `src/app/components/CLAUDE.md`): liest `TutorialSelectors.isTutorialActive`/`currentStepIndex`
  per `selectSignal`, leitet den aktuellen Schritt aus `tutorialSteps` ab (`computed()`) und
  dispatcht `NextTutorialStep`/`PreviousTutorialStep`/`SkipTutorial`/`CompleteTutorial`
  (`src/app/actions/tutorial-action.ts`). Beim letzten Schritt löst "Weiter" `CompleteTutorial`
  statt `NextTutorialStep` aus (`isLastStep()`-Guard im Container) — der Reducer selbst kennt
  die Gesamtschrittzahl nicht, das ist bewusst reine Präsentations-/Ableitungslogik, kein
  eigener Store-Zugriffspunkt.
- **`tutorial-overlay/tutorial-overlay.component.ts`** (+ `.html`/`.scss`) — reine Darstellung
  über `input()`/`output()`. Spotlight-Highlight: `effect()` liest bei jedem Schrittwechsel
  `step().targetSelector` per `document.querySelector()` + `getBoundingClientRect()` (kein
  ViewChild/Store, weil das Zielelement zu einer beliebigen anderen Komponente irgendwo im Rest
  der App gehört) und hält die Position in einem lokalen `spotlightRect`-Signal. Hat der Schritt
  keinen `targetSelector` (oder ist das Element nicht im DOM), dimmt `.tutorial-dim` den
  kompletten Screen ohne Ausschnitt. `.tutorial-overlay` selbst ist `pointer-events: none` — nur
  die Karte (`.tutorial-card`) ist interaktiv, damit ein Spieler laut PR-3-Planung während der
  Timer-/Encounter-/Handkarten-Schritte parallel weiterspielen kann.
- **`TutorialState`/`TutorialSelectors`** (`src/app/states/tutorial-state.ts`,
  `src/app/selectors/tutorial-selector.ts`) — `{ hasSeenTutorial, active, currentStepIndex }`,
  geräte-lokal über `withNgxsStoragePlugin({ keys: '*' })` persistiert (siehe
  `src/app/states/CLAUDE.md`). `SkipTutorial` setzt `hasSeenTutorial: true` genauso wie
  `CompleteTutorial` — ein bewusst übersprungenes Tutorial soll beim späteren Auto-Trigger
  (PR 5) nicht erneut aufpoppen.
- Eingehängt global in `app.component.html` (`<app-tutorial-overlay-container>` neben
  `<router-outlet>`), nicht pro Route — das Overlay muss unabhängig davon sichtbar sein, ob der
  Hilfe-Button auf dem Startscreen oder später ein Auto-Trigger im laufenden Spiel feuert.
- Manueller Einstiegspunkt weiterhin auf `StartscreenComponent` (Button "Wie funktioniert das
  Spiel? (Tutorial)", dispatcht `StartTutorial`) — funktioniert unabhängig vom
  `hasSeenTutorial`-Flag, jederzeit erneut nutzbar.
- **Auto-Trigger (PR 5)** — `GameComponent.ngOnInit()` ruft `autoStartTutorialForFirstSingleplayerGame()`
  auf: dispatcht `StartTutorial`, wenn `currentNumberOfPlayers() === 1` (Singleplayer) und
  `!hasSeenTutorial()`. Kein Auto-Start im Multiplayer (Design-Entscheidung 3 im Plan) — dort
  bleibt der manuelle Hilfe-Button der einzige Einstiegspunkt. `StartTutorial`s Reducer
  (`tutorial-state.ts`) patcht nur `active`/`currentStepIndex`, lässt `hasSeenTutorial`
  unangetastet — der Dispatch ist also unkritisch, falls `GameComponent` mehrfach initialisiert
  wird (z.B. Boss-Wechsel bleibt auf derselben Komponente, kein erneuter `ngOnInit()`).

## Status: Issue #54 vollständig umgesetzt

Alle 5 geplanten PRs sind umgesetzt — Infrastruktur, Inhalte für alle 7 Stationen und der
Auto-Trigger beim ersten Singleplayer-Spiel. Folgearbeit (falls gewünscht) wäre eigenständig zu
planen, kein offener Punkt aus `docs/done/tutorial-plan.md` mehr.
