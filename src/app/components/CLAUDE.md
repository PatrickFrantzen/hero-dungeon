# src/app/components/ — Feature-Komponenten

Meist standalone + signal-basiert (`input()`/`input.required()`, `output()`, `computed()`,
`effect()`) mit `ChangeDetectionStrategy.OnPush`. Details zum Migrationsstand siehe unten und
Root-`CLAUDE.md`.

## Styling: Angular Material + Tailwind CSS

Neben Angular Material (Komponenten: `mat-card`, `mat-form-field`, `mat-*-button`, …) steht seit
2026-08-30 **Tailwind CSS v3** als Utility-Layer für Layout/Spacing/Responsive-Anpassungen zur
Verfügung (`tailwind.config.js`, `.postcssrc.json`, `@tailwind base/components/utilities` in
`src/styles.scss`). Kein zweites Komponenten-Framework (Bootstrap/DaisyUI) — das würde gegen
Materials eigene Optik laufen.

- Alle Tailwind-Klassen sind mit `tw-` geprefixt (`tailwind.config.js` → `prefix: 'tw-'`), um
  Kollisionen mit Material-/CDK-Klassennamen auszuschließen.
- `preflight` ist deaktiviert (`corePlugins.preflight: false`), damit Tailwinds CSS-Reset nicht
  gegen Materials eigene Basis-Styles läuft.
- Tailwind eignet sich für Screens **ohne** Material-Komponenten (reines HTML/CSS wie bisher
  `startscreen/`) — dort Utility-Klassen statt komponenteneigenem SCSS verwenden. Bei
  Komponenten, die bereits `mat-*`-Elemente nutzen (`signin/`, `signup/`, Dialoge), Material
  weiter für Struktur/Formulare nutzen; Tailwind higher dort nur ergänzend für Layout/Spacing,
  nicht um Material-Komponenten zu ersetzen.
- Referenzumbau: `startscreen/` (`startscreen.component.html`) — komplett auf `tw-`-Utilities
  umgestellt, `startscreen.component.scss` ist jetzt leer.
- Weitere durchgeführte Umstellungen (2026-08-30):
  - `dialog-choose-hero/`, `dialog-game-settings/`, `dialog-heropower/`: identisches
    `.dialog`/`.settings`-SCSS-Boilerplate (dreifach dupliziert) durch `tw-`-Klassen direkt im
    Template ersetzt, `.scss`-Dateien sind jetzt leer. Bestätigungs-Buttons einheitlich auf
    `mat-flat-button color="primary"` (statt `mat-button`) für klareren Call-to-Action.
  - `heropower/heropower.component.html`: Inline-`style="..."`-Attribute (Flex-Layout,
    `color: white`) durch `tw-flex tw-flex-col tw-items-center`/`tw-text-white` ersetzt.
  - `player-hand/player-hand.component.html`: bis dahin komplett unstyled Buttons
    (`solo-event-button`, `rest-button`) mit `tw-`-Klassen gestylt (Farben/Radius/Hover
    passend zu den Akzentfarben aus `startscreen/`: Grün für primäre Aktion, Lila für
    sekundäre). Positionierung (`position: absolute`, `z-index`) bleibt in
    `player-hand.component.scss`, da Layout-Konzern.
  - `enemy/`, `game/` bereits konsistent (Material-Card bzw. eigenes, bereits responsives SCSS
    mit `clamp()`) — unverändert gelassen.

## Smart/Dumb-Container-Muster

`enemy/` und `heropower/` haben je ein Container/Presenter-Paar: der `*-container/`-
Unterordner liest Store/Firestore und leitet Ergebnisse per `input()` an die reine
Darstellungs-Komponente weiter (kein eigener Store-/Firestore-Zugriff dort). Details je
Verzeichnis: `enemy/CLAUDE.md`, `heropower/CLAUDE.md`.

Dieses Muster ist **nicht** überall durchgezogen — `game.component.ts`, `startscreen/` und die
Dialog-Komponenten greifen direkt auf Store/Services zu. Für ein neues Feature mit klar
trennbarer Anzeige- vs. Lade-Logik das Container/Presenter-Muster verwenden; ein einfacher,
rein darstellender Screen ohne solche Trennung tut.

## OnPush-Voraussetzung

Eine Komponente kann nur dann auf `OnPush` stehen, wenn **alle** ihre Vorfahren auf dem Pfad zur
Root-Komponente entweder selbst `OnPush` sind oder vollständig signal-basiert arbeiten (Angulars
Signal-Change-Detection markiert bei Signal-Änderungen gezielt den Pfad bis zur Wurzel,
unabhängig von der Strategie dazwischenliegender Komponenten — das gilt aber nur für Signal-
Reads, nicht für rohe `.subscribe()`-Mutationen). Herleitung und ein durchgearbeitetes Beispiel:
`docs/done/onpush-refactor-plan.md`.

## Nicht alles ist migriert — beim Anfassen prüfen, nicht annehmen

`StartscreenComponent` mischt laut Root-`CLAUDE.md` weiterhin klassische Firestore-Callbacks mit
Signal-Reads — Stand beim letzten Abgleich zeigte dort aber nur noch `store.selectSignal(...)`-
Reads und keinen direkten `onSnapshot`/`getDoc`-Aufruf mehr in der Komponente selbst (Zugriff
läuft über die Repository-Services, siehe `services/CLAUDE.md`). Diese `CLAUDE.md` kann veralten
— vor einer Aussage über den Migrationsstand einer konkreten Komponente immer den tatsächlichen
Code ansehen, nicht diesen Text zitieren.

## Hotspot

`player-hand/` ist der größte verbleibende Ausreißer vom Smart/Dumb-Muster — eigene
`CLAUDE.md` dort lesen, bevor diese Komponente angefasst wird.

## game/

`game/CLAUDE.md` beschreibt neben `GameComponent` als Host auch den Dungeon-Countdown-Timer,
dessen Umsetzung sich über State/Action/Selector, `CardPlayService`, Repository-Services und
`game.ts` zieht — vor jeder Timer-Änderung dort lesen, unabhängig davon, welche der beteiligten
Dateien konkret angefasst wird.

## Dialoge

`dialog-choose-hero/`, `dialog-game-settings/`, `dialog-heropower/` teilen sich
`dialog-base.component.ts` (`BaseDialogComponent<TResult>`) und `dialog-results.ts` (typisierte
Ergebnis-Interfaces) statt jeweils eigenes `MatDialogRef`-Boilerplate zu wiederholen — neue
Dialoge sollten davon erben statt bei null anzufangen.
