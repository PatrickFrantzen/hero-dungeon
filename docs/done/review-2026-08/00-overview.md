# Code-Review hero-dungeon — Überblick

## Status (2026-08-29, PR #21) — abgeschlossen, hierher nach `docs/done/` verschoben

Dieses Review wurde in einer Folge-Session abgearbeitet: die beiden in diesem Dokument
genannten Funktionsfehler waren beim Prüfen bereits vor dem Review behoben (Commit `ed16685`,
#20) und brauchten keinen Fix mehr. Die klein-/mittelgroßen, risikoarmen Befunde aus allen
fünf Einzeldateien wurden in PR #21 umgesetzt (toter Code entfernt, Naming-Tippfehler
korrigiert, DRY-Duplikate konsolidiert, fehlendes Auth-/Dialog-Error-Handling ergänzt,
`monster.class.ts` von Datenliteralen befreit — Details in den Commit-Messages von PR #21 und
in den Status-Abschnitten der Einzeldateien).

Die sechs großen, bewusst zurückgestellten strukturellen Umbauten (siehe „Empfohlene
Reihenfolge" unten, Punkte 3–7) sind **nicht** Teil von PR #21 und liegen jetzt als eigene,
für neue Sessions umsetzbare Pläne vor:

- [`docs/planned/firestore-repository-service-plan.md`](../../planned/firestore-repository-service-plan.md) — Punkt 3, Services konsolidieren
- [`docs/planned/currentGame-state-split-plan.md`](../../planned/currentGame-state-split-plan.md) — Punkt 4, `currentGame-state.ts` aufteilen
- [`docs/planned/player-hand-decomposition-plan.md`](../../planned/player-hand-decomposition-plan.md) — Punkt 5, `PlayerHandComponent` entflechten (inkl. Heropower-Strategy-Pattern als Stretch-Goal)
- [`docs/planned/hero-data-model-plan.md`](../../planned/hero-data-model-plan.md) — Punkt 6, Helden-Datenmodell umstellen
- [`docs/planned/dialog-auth-unification-plan.md`](../../planned/dialog-auth-unification-plan.md) — Punkt 7, Dialog-/Auth-Komponenten vereinheitlichen

Dieses Dokument bleibt unverändert als historische Referenz für die Befunde erhalten; die
Zeilenangaben unten spiegeln den Stand zum Zeitpunkt des Reviews, nicht den aktuellen Code.

---

Vollständiges Code-Review der App (Stand: 2026-08-29, Branch `claude/app-code-review-4rwca7`,
letzter geprüfter Commit `22c7461`). Das Review ist auf mehrere Dateien aufgeteilt, damit
mehrere Agenten/Entwickler die Punkte parallel abarbeiten können, ohne sich in derselben Datei
in die Quere zu kommen. Jede Datei deckt einen in sich abgeschlossenen Teil der Codebasis ab.

**Hinweis zum IST-Zustand:** Die `CLAUDE.md` im Repo-Root beschreibt noch Angular 15,
Modul-basiert (`AppModule`), `@Select()`-Decorator + manuelles Subscribe. Der tatsächliche Code
ist inzwischen weiter (siehe `git log`, u.a. #13–#19): Angular ist über die offizielle Update-
Kette auf eine neuere Version gehoben, alle Komponenten sind standalone, viele Reads laufen über
Signals (`input()`, `store.selectSignal()`, `computed()`), `ChangeDetectionStrategy.OnPush` ist
auf den meisten Komponenten gesetzt. `@ngxs/store` ist weiterhin im Einsatz. Dieses Review
richtet sich nach dem tatsächlichen Code, nicht nach der veralteten `CLAUDE.md`-Beschreibung —
eine Aktualisierung von `CLAUDE.md` ist nicht Teil dieses Reviews, sollte aber separat verfolgt
werden.

## Dateien in diesem Review

| Datei | Scope | Umfang |
|---|---|---|
| [`01-state-management.md`](./01-state-management.md) | `src/app/actions/`, `src/app/selectors/`, `src/app/states/` (NGXS) | 296 Zeilen |
| [`02-services.md`](./02-services.md) | `src/app/services/` (Firestore-Zugriff) | 339 Zeilen |
| [`03-components-game.md`](./03-components-game.md) | `game`, `player-hand`, `enemy(-container)`, `heropower(-container)`, `app.component.ts` | 410 Zeilen |
| [`04-components-dialogs-auth.md`](./04-components-dialogs-auth.md) | `dialog-choose-hero`, `dialog-game-settings`, `dialog-heropower`, `signin`, `signup`, `startscreen`, Routing | 255 Zeilen |
| [`05-models.md`](./05-models.md) | `src/models/helden/*`, `src/models/monster/monster.class.ts`, `game.ts`, `user.class.ts` | 369 Zeilen |

Jede Datei ist unabhängig lesbar und enthält priorisierte Befunde (kritisch/wichtig/nice-to-
have) mit `datei.ts:Zeile`-Referenzen. Wer an einem Teilbereich arbeitet, braucht nur seine
Datei zu lesen — Querverweise zwischen den Bereichen sind hier im Überblick zusammengefasst.

## Zwei echte Funktionsfehler (nicht nur Stil) — zuerst beheben

Bei der Detailanalyse sind zwei konkrete Bugs aufgefallen, die unabhängig von jeder DRY/SOLID-
Betrachtung sofort behoben werden sollten, da sie Spielverhalten beeinträchtigen:

1. **8 von 10 Heldenfähigkeiten sind wirkungslos** (`03-components-game.md`, Befund 1).
   `HeropowerContainerComponent` (`src/app/components/heropower/heropower-container/heropower-container.component.ts:77-81`)
   definiert eigene, leere Methoden `checkheropowerArray()`, `checkJaegerinHeropower()`,
   `checkWalkuereHeropower()`, die gleichnamige, echte Implementierungen in
   `PlayerHandComponent` (`player-hand.component.ts:147/282/501`) überschatten. Der `effect()`
   im Container ruft die eigenen (leeren) Methoden auf `this` auf, nie die echte Logik in der
   Elternkomponente. Nur der Dieb-Pfad funktioniert, weil er separat über
   `DiebServiceService` läuft. Betrifft alle anderen 8 Heldentypen.

2. **Boss-Schwierigkeitslogik vermutlich wirkungslos** (`05-models.md`, Befund 6).
   `src/models/monster/monster.class.ts:15`: `currentBoss.bossname == 'Baby-Barbar' ||
   (currentBoss = 'Baby-barbar')` ist eine Zuweisung (`=`) statt eines Vergleichs im zweiten
   Teil der Bedingung — macht den Ausdruck praktisch immer wahr. Zusätzlich existiert das Feld
   `bossname` im `Mob`-Interface gar nicht (heißt dort `name`).

Diese zwei Punkte sind keine Frage von Code-Qualität, sondern von korrektem Spielverhalten und
sollten vor den DRY/SOLID-Refactorings als eigener, kleiner Fix behandelt werden (jeweils in
einer eigenen PR, analog zum bisherigen Repo-Stil aus `docs/done/`).

## Cross-cutting: Muster, die sich durch die ganze App ziehen

Diese Punkte tauchen in mehreren Einzeldateien wieder auf und sind hier gebündelt, damit die
Priorisierung app-weit sichtbar ist:

### 1. Firestore-Zugriff ohne gemeinsame Abstraktion, ohne Error-Handling
Praktisch jeder Service (`02-services.md`) und mehrere Komponenten (`03-components-game.md`,
`04-components-dialogs-auth.md`) bauen `getFirestore()`/`doc()`/`updateDoc()`-Aufrufe jeweils
neu zusammen, ohne try/catch. `PlayerHandComponent` umgeht sogar den vorhandenen
`LoadGameService` komplett und baut Firestore-Zugriffe selbst (siehe `02-services.md`,
Befund zu totem Code). Übergreifender Vorschlag: ein zentraler `FirestoreRepositoryService`
(Skizze in `02-services.md`) mit eingebautem Error-Handling, den alle Services und
Komponenten nutzen — löst gleichzeitig die Duplikate in `SaveGameService`/`LoadGameService`
und schließt die fehlende Fehlerbehandlung aus `CLAUDE.md`s "Bekannte Baustellen".

### 2. Datengetriebene Duplikate statt Konfiguration
Sowohl bei den Heldenklassen (`05-models.md`) als auch bei mehreren State-Reducern
(`01-state-management.md`) und den Heropower-Check-Methoden (`03-components-game.md`) liegt
das gleiche Grundmuster vor: fast identischer Code, der sich nur in Daten unterscheidet
(Karten-Zusammensetzung, Feldname, Heldenname). Übergreifender Vorschlag: wo eine
Klassenhierarchie kein unterscheidbares Verhalten trägt (Helden), auf Konfigurationsobjekte +
Factory umstellen; wo Reducer nur ein Feld patchen, eine gemeinsame Utility-Funktion nutzen.

### 3. `PlayerHandComponent` als zentraler Hotspot
Mit 622 Zeilen die mit Abstand größte Komponente, taucht in `03-components-game.md` als
Hauptbefund auf und wird bereits in `docs/done/onpush-refactor-plan.md` als "nicht im Scope"
für den OnPush-Refactor benannt. Die dortige Prognose ("eigenes, größeres Refactoring") wird
durch dieses Review bestätigt und konkretisiert (Extraktion von `CardPlayService`,
`HeropowerService`/Strategy-Pattern, `FirestoreSyncService`).

### 4. Fehlendes Nutzer-Feedback bei Fehlern
Sowohl bei Firestore-Schreibfehlern (Services) als auch bei Firebase-Auth-Fehlern
(`signin`/`signup`, `04-components-dialogs-auth.md`) werden Fehler aktuell nicht an die UI
durchgereicht — der Nutzer sieht bei einem fehlgeschlagenen Login/einer fehlgeschlagenen
Registrierung oder einem verlorenen Firestore-Write keine Rückmeldung.

### 5. Naming- und Sprachinkonsistenzen
Deutsch/Englisch-Mix (von `CLAUDE.md` bereits als bekannte Baustelle benannt, hier nicht
zusätzlich vereinheitlicht), plus konkrete Tippfehler/Inkonsistenzen, die den Umbau erschweren:
`currentUser-selectos.ts` (Datei-Tippfehler, 7 Importstellen), `dieb-service.service.ts`
(redundantes Suffix), `DialogGameSettings` (fehlendes `Component`-Suffix), "choosen" statt
"chosen" an mehreren Stellen. Details je Bereich in den Einzeldateien.

### 6. Tote Code-Pfade
`MobState` (`01-state-management.md`) und `CurrentGameService` (`02-services.md`) sind jeweils
vollständig implementiert, aber nirgends aktiv genutzt bzw. nicht registriert — zwei
Wahrheiten-Quellen, die verwirren, ohne dass eine davon zur Laufzeit greift. Vorschlag: löschen
oder (falls beabsichtigt) tatsächlich anschließen — jeweils mit Tests belegen, welcher Fall
zutrifft.

## Empfohlene Reihenfolge

Passend zum bisherigen Repo-Stil (ein Issue/eine PR pro Schritt, `ng build`/`ng test` grün
halten, siehe `CLAUDE.md` → "Arbeitsweise für Änderungen"):

1. **Bugfixes** (siehe oben, 2 Punkte) — klein, isoliert, hohe Wirkung.
2. **Tote Code-Pfade entfernen** (`MobState`, `CurrentGameService`) — reduziert Verwirrung vor
   den größeren Refactorings.
3. **Services konsolidieren** (`02-services.md`) — `FirestoreRepositoryService`, da mehrere
   andere Vorschläge (State, Komponenten) darauf aufbauen können.
4. **`currentGame-state.ts` aufteilen** (`01-state-management.md`) — größte/aktivste State-
   Datei, vier vermischte Verantwortlichkeiten.
5. **`PlayerHandComponent` schrittweise entflechten** (`03-components-game.md`) — größter
   Einzelbrocken, am besten in mehreren kleinen PRs analog zum bestehenden OnPush-Plan.
6. **Helden-Datenmodell umstellen** (`05-models.md`) — Konfiguration statt 10 Klassen.
7. **Dialog-/Auth-Komponenten vereinheitlichen** (`04-components-dialogs-auth.md`) —
   `BaseDialogComponent`, `AuthFormService`, Fehler-Feedback in UI.
8. Naming-Konsistenz als begleitender Aufräum-Schritt, nicht als eigener großer Sprung
   (Umbenennungen erzeugen große Diffs — am besten zusammen mit den jeweiligen
   Refactoring-Schritten oben, nicht isoliert).

Jeder dieser Punkte ist bewusst so geschnitten, dass er unabhängig von den anderen als eigene
PR umsetzbar ist — Details, Codebeispiele und vollständige Befundlisten stehen in den
verlinkten Einzeldateien.
