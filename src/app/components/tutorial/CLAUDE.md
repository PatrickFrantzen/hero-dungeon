# tutorial/ — Interaktives Onboarding-Overlay

Umsetzung von [Issue #54](https://github.com/PatrickFrantzen/hero-dungeon/issues/54) nach
`docs/planned/tutorial-plan.md` — **vor jeder Änderung hier zuerst den Status-Abschnitt in
diesem Plan lesen** (welcher der 5 geplanten PRs ist bereits umgesetzt).

## Aufbau (PR 1 — Infrastruktur, PR 2 — Inhalt Startscreen/Heldenauswahl)

- **`tutorial-steps.data.ts`** — reines Datenarray (`TutorialStep[]`, Felder `title`/`body`/
  optional `targetSelector`), analog zum `monster-collection.data.ts`-Muster. Enthält seit PR 2
  fünf echte Schritte für Station 1+2 (Startscreen-Überblick, Singleplayer, Multiplayer
  erstellen/beitreten, Heldenauswahl, Abschluss-Hinweis) — Stationen 3–7 (Timer, Encounter,
  Handkarten, Heldenfähigkeit, Sieg/Niederlage) kommen in PR 3–4 dazu, bis dahin endet das
  Tutorial nach der Heldenauswahl-Erklärung mit "Fertig".
- Die drei `targetSelector`e (`#tutorial-target-singleplayer`, `#tutorial-target-multiplayer`)
  sitzen als stabile `id`s in `startscreen.component.html` (Singleplayer-Button bzw. ein
  umschließendes `<div>` um Multiplayer-Button + Join-Input + Join-Button). Die
  Heldenauswahl-Schritte haben **bewusst keinen** `targetSelector`: `DialogChooseHeroComponent`
  ist zu diesem Zeitpunkt nicht geöffnet (Tutorial startet nur vom Startscreen aus), ein
  `document.querySelector()` würde ins Leere laufen und das Overlay fällt auf Volldimmung ohne
  Ausschnitt zurück (siehe `TutorialOverlayComponent.spotlightRect`-Fallback unten).
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
- Manueller Einstiegspunkt aktuell nur auf `StartscreenComponent` (Button "Wie funktioniert das
  Spiel? (Tutorial)", dispatcht `StartTutorial`) — noch kein Auto-Trigger (siehe PR 5 im Plan).

## Was noch fehlt (siehe PR-Schnitt im Plan)

Echte Schrittinhalte für Station 3–7 (Dungeon-Timer, Encounter, Handkarten, Heldenfähigkeit,
Sieg/Niederlage, PR 3–4) und der Auto-Trigger beim ersten Singleplayer-Spiel (PR 5) fehlen noch.
