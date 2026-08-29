# src/app/components/ — Feature-Komponenten

Meist standalone + signal-basiert (`input()`/`input.required()`, `output()`, `computed()`,
`effect()`) mit `ChangeDetectionStrategy.OnPush`. Details zum Migrationsstand siehe unten und
Root-`CLAUDE.md`.

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

## Dialoge

`dialog-choose-hero/`, `dialog-game-settings/`, `dialog-heropower/` teilen sich
`dialog-base.component.ts` (`BaseDialogComponent<TResult>`) und `dialog-results.ts` (typisierte
Ergebnis-Interfaces) statt jeweils eigenes `MatDialogRef`-Boilerplate zu wiederholen — neue
Dialoge sollten davon erben statt bei null anzufangen.
