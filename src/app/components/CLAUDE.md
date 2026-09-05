# src/app/components/ — Feature-Komponenten

Meist standalone + signal-basiert (`input()`/`input.required()`, `output()`, `computed()`,
`effect()`) mit `ChangeDetectionStrategy.OnPush`. Details zum Migrationsstand siehe unten und
Root-`CLAUDE.md`.

**Dependency Injection: `inject()`** (Issue #94) — Abhängigkeiten als Klassenfeld
(`private store = inject(Store);`) statt Constructor-Parameter, siehe Root-`CLAUDE.md`.
`heropower-container/`, `tutorial-overlay-container/`, `enemy-container/` und
`dialog-base.component.ts` (+ die sechs Dialog-Subklassen, die zuvor `MatDialogRef` per
`super(dialogRef)` durchreichten) wurden dafür umgestellt — `BaseDialogComponent` injiziert
`MatDialogRef` jetzt selbst, Subklassen rufen `super()` ohne Argumente. Ein Constructor bleibt
nur, wo tatsächlich Logik nötig ist (z.B. `HeropowerContainerComponent`s `effect()`) oder wo eine
Subklasse eigene, hier nicht umgestellte Constructor-DI hat (`DialogLinkAccountComponent`/
`DialogAccountOfferComponent` — `FormBuilder`/`AuthFormService`/`Auth`/
`LocalSaveMigrationService`, nicht Teil von Issue #94).

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
  - `enemy/enemy.component.scss` (2026-08-30, Folgeänderung): `.current-Enemy` zog sich vorher
    trotz `max-width: 100%` auf die volle Breite von `.mainfield` (dessen Flex-Column-Default
    `align-items: stretch` streckt Kinder ohne eigenes `align-self`, siehe `game-timer` als
    Gegenbeispiel). Jetzt `align-self: center` + `width: fit-content` + `max-width: min(480px,
    92vw)`, damit die Karte nur so breit wird wie ihr Inhalt (Name/Token/Typ) und der
    Hintergrund sichtbar bleibt.

## Typografie: Cinzel für Überschriften (seit 2026-09-02)

Fließtext bleibt projektweit Roboto (Lesbarkeit) — Überschriften/Titel bekommen zusätzlich eine
Fantasy-Serife: `--font-heading: 'Cinzel', Georgia, serif;` (`:root` in `src/styles.scss`, Font
selbst per Google-Fonts-Link in `index.html` geladen, analog zu Roboto). Bewusst als
CSS-Variable statt eines Utility-Klassen-Sets, damit eine spätere Änderung der Schriftart nur an
einer Stelle passiert. Aktuell verwendet an drei Stellen (Abstimmung mit Patrick, 2026-09-02):

- **Dialogtitel** — global über `.mat-mdc-dialog-title` in `src/styles.scss` (trifft alle drei
  `<h1 mat-dialog-title>`-Dialoge auf einmal, siehe `dialog-base.component.ts`), nicht einzeln
  pro Dialog-SCSS dupliziert.
- **Dungeon-Timer** — `.game-timer__label`/`.game-timer__time` in `game.component.scss`.
- **Gegnername** — `.enemy-name` in `enemy.component.scss` (Teil des Wappen-Restylings, siehe
  `enemy/CLAUDE.md`).

Eine neue Überschrift/ein neuer Titel sollte `var(--font-heading)` verwenden statt die
Schriftart erneut hart zu kodieren oder Roboto zu belassen (letzteres bleibt für Fließtext/UI-
Beschriftungen wie Buttons/Formularlabels korrekt).

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

**Kein Wegklicken ohne Auswahl** (Live-Test-Bugfix, 2026-09-02): `DialogGameSettingsComponent`
(`startscreen.component.ts`, `openDialog()`) und `DialogChooseHeroComponent`
(`game.component.ts`, `openDialog()`) werden mit `disableClose: true` geöffnet — vorher liess
sich beides per Backdrop-Klick/Escape ohne jede Auswahl schliessen, der Aufrufer bekam dann kein
Ergebnis und der Spieler stand ohne Held/Spiel fest, ohne Fehlermeldung. Zusätzlich hat
`DialogChooseHeroComponent.selectedValue` jetzt keinen impliziten Default mehr (`Heros |
undefined`) und der "Ok"-Button ist disabled, solange kein Held gewählt ist — analog zum
bereits bestehenden `[disabled]`-Pattern in `DialogGameSettingsComponent` (dort über
`FormControl.invalid`). Ein neuer Dialog mit Pflichtauswahl sollte demselben Muster folgen:
`disableClose: true` an der `.open()`-Aufrufstelle + `[disabled]` auf dem Bestätigungs-Button,
solange keine gültige Auswahl vorliegt.

**Ausnahme vom "Dialog sammelt nur Eingaben"-Muster:** `dialog-account-offer/` (Issue #75,
`GameComponent`, "Account erstellen?" bei Singleplayer-Spielende) führt Registrierung +
Migration selbst aus (`AuthFormService.register()` + `LocalSaveMigrationService.migrateAll()`),
statt wie die drei obigen Dialoge nur Formulardaten zurückzugeben und den Aufrufer async
arbeiten zu lassen — analog zu `SignupComponent.register()`, weil der Dialog ohnehin schon
Formular-/Fehlerzustand hält. `disableClose` ist hier bewusst `false` (Standard): Ablehnen ist
ein legitimer, folgenloser Pfad, kein "Klick geht ins Leere" wie bei den Pflichtauswahl-Dialogen
oben. `dialog-link-account/` (Issue #78, `GameMenuComponent`, "Account verknüpfen") folgt exakt
demselben Muster (Struktur/Test-Stil 1:1 von `dialog-account-offer/` übernommen), nur mit
`AuthFormService.linkAnonymousAccount()` statt `register()` + `migrateAll()` — kein
Migrationsschritt nötig, da `linkWithCredential()` dieselbe `uid` behält. Ein Fehlschlag (z.B.
E-Mail bereits vergeben) zeigt `errorMessage` im Dialog und lässt den bestehenden anonymen
Account unverändert nutzbar, `disableClose` ebenfalls `false`.

**`dialog-confirm/` (Issue #85)** — generischer Bestätigungsdialog (`DialogConfirmData: {
title, message }` per `MAT_DIALOG_DATA`, analog zu `dialog-heropower/`s Injection-Stil) für
destruktive Aktionen ohne Rückgängig-Option (aktuell "Spielstand löschen", Singleplayer wie
Multiplayer, siehe `game-menu/CLAUDE.md` und `services/CLAUDE.md`). Reines "Dialog sammelt nur
Eingaben"-Muster — der Aufrufer entscheidet nach `{ confirmed: true }`, was tatsächlich gelöscht
wird, der Dialog selbst führt keinen Seiteneffekt aus. `disableClose` bewusst `false`
(Standard): Abbrechen ist immer ein gültiger, folgenloser Pfad bei einer Bestätigung.

**`dialog-select-save/` (2026-09-05)** — "Spielstand auswählen": ersetzt die bisherigen, direkt
in `StartscreenComponent`/`GameMenuComponent` inline gerenderten Listen ("Meine Spielstände"/
"Meine Spiele"/"Spielstände laden") durch einen gemeinsamen Auswahldialog. `DialogSelectSaveData:
{ entries: SaveListEntry[] }` — `SaveListEntry` (`id`/`label`/`mode: 'singleplayer' |
'multiplayer'`/`lastPlayedAt: number | null`) baut der Aufrufer aus seinen eigenen
`localSaves()`/`myGames()`-Signalen zusammen (nur er kennt das passende Held-/Status-Label, siehe
`heroNameOf()`/`saveLabel()`), der Dialog selbst sortiert absteigend nach `lastPlayedAt` (ein
`null` - unbekannter Zeitpunkt, z.B. ein Multiplayer-Altdatensatz vor der Umstellung von
`users/{uid}.games` auf `JoinedGame[]`, siehe `services/CLAUDE.md` - landet am Ende) und zeigt pro
Eintrag ein Modus-Badge + formatiertes Datum (`Intl.DateTimeFormat('de-DE')`). Klick auf einen
Eintrag schließt mit `DialogSelectSaveResult: { selectedId, mode }`, der Aufrufer entscheidet
danach selbst, ob er zu `/local-game/:id` oder `/game/:id` navigiert (Ausnahme vom "Dialog
sammelt nur Eingaben"-Muster: **Löschen ist Teil des Dialogs selbst**, nicht des
Ergebnis-Contracts — nur für `mode: 'singleplayer'`-Einträge sichtbar, da Multiplayer-Einträge in
"Meine Spiele" auch vorher keinen Löschen-Button hatten; öffnet dafür intern `dialog-confirm/`
und ruft bei Bestätigung direkt `LocalSingleplayerSaveService.deleteSave()` auf, entfernt den
Eintrag aus der eigenen Kopie der Liste, ohne den Dialog zu schließen). Der Aufrufer liest nach
`afterClosed()` sicherheitshalber seine `localSaves()` neu ein (billig, synchron), falls im
Dialog etwas gelöscht wurde. `GameMenuComponent` übergibt wegen des bereits bestehenden
`isSingleplayer()`-Gates in seinem `effect()` nie beide Modi gleichzeitig (nur Startscreen zeigt
Singleplayer- und Multiplayer-Einträge gemischt in einer Liste).
