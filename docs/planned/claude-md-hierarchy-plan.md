# Plan: Hierarchische CLAUDE.md-Struktur

Kontext: Die einzige `CLAUDE.md` im Repo-Root ist mit jedem Refactoring gewachsen (Tech-Stack,
Struktur, bekannte Baustellen, Arbeitsweise) und beschreibt inzwischen Details aus fast jedem
Bereich des Codes auf einmal. Ein Agent, der z.B. nur `firestore-sync.service.ts` anfassen soll,
lädt trotzdem den kompletten Kontext zu Helden-Datenmodell, OnPush-Refactor und Dialog-
Vereinheitlichung mit. Ziel dieses Plans: die Root-`CLAUDE.md` auf eine schlanke
Projekterklärung + Index reduzieren und Detailwissen in `CLAUDE.md`-Dateien pro Verzeichnis
auslagern, die Claude Code automatisch nachlädt, sobald es eine Datei in diesem Verzeichnis
liest.

## Funktionsweise, auf die der Plan aufbaut (Claude Code Memory-Mechanik)

- Claude Code liest beim Start nur die Root-`CLAUDE.md` (plus ggf. `~/.claude/CLAUDE.md`).
  `CLAUDE.md`-Dateien in Unterverzeichnissen werden **nicht** beim Start geladen, sondern erst
  automatisch nachgezogen, sobald Claude eine Datei aus diesem Verzeichnis liest oder bearbeitet
  — das ist genau der gewünschte Effekt ("immer feiner nachladen").
  Nach einem Context-Compaction wird die Root-`CLAUDE.md` automatisch erneut injiziert, verzeichnis-
  lokale `CLAUDE.md`-Dateien dagegen nicht — sie laden erst wieder beim nächsten Zugriff auf eine
  Datei in ihrem Verzeichnis.
- Spezifischere `CLAUDE.md`-Dateien (näher am bearbeiteten File) überschreiben/ergänzen
  allgemeinere. Root-`CLAUDE.md` sollte deshalb nur projektweite, immer relevante Infos tragen
  (Tech-Stack, Build/Test-Befehle, übergreifende Konventionen, Index), keine Feature-Details.
- Best Practice (mehrfach in der Doku/Community bestätigt): jede `CLAUDE.md` möglichst unter
  ~200 Zeilen halten, konkrete statt vage Aussagen ("nutze `store.selectSignal()`, nicht
  `@Select()`" statt "nutze moderne Patterns"), und Import-Syntax (`@pfad/zu/DATEI.md`) sparsam
  einsetzen, weil importierter Inhalt trotzdem vollständig in den Kontext expandiert wird (max.
  4 Hops Verschachtelungstiefe) — für dieses Repo also lieber eigenständige verzeichnis-lokale
  `CLAUDE.md`-Dateien als eine tief verschachtelte Import-Kette.

## Zielstruktur

```
CLAUDE.md                                   # schlank: Projekterklärung + Index (s.u.)
src/app/components/CLAUDE.md                # Smart/Dumb-Konvention, OnPush-Voraussetzung,
                                             #   Signal-Pattern (input/output/computed/effect),
                                             #   Verweis auf Hotspot player-hand/
src/app/components/player-hand/CLAUDE.md    # Hotspot-Warnung + Link auf
                                             #   docs/planned/player-hand-decomposition-plan.md
src/app/components/enemy/CLAUDE.md          # Container/Presenter-Paar, was liegt wo
src/app/components/heropower/CLAUDE.md      # Container/Presenter-Paar, was liegt wo
src/app/services/CLAUDE.md                  # kein Repository-Layer (Stand), welcher Service
                                             #   wofür zuständig ist, Firestore-Fehlerbehandlung
                                             #   (Verweis auf firestore-repository-service-plan.md)
src/app/states/CLAUDE.md                    # NGXS: welche States existieren, welche davon in
                                             #   app.config.ts registriert sind (einzige Quelle
                                             #   der Wahrheit bleibt app.config.ts selbst!),
                                             #   Zusammenspiel actions/ ↔ states/ ↔ selectors/
src/models/CLAUDE.md                        # helden/ + monster/ + card/hero/game/user-Klassen,
                                             #   Verweis auf hero-data-model-plan.md
firestore.rules ist bereits gut lokalisiert  # keine eigene CLAUDE.md nötig, Rules-Datei selbst
                                             #   + firestore.rules.test.js sind kurz genug
docs/CLAUDE.md                              # Konvention done/ vs. planned/, wie ein neuer Plan
                                             #   aussehen soll (Diagnose → TODOs → Verifikation)
```

`src/app/actions/` und `src/app/selectors/` bekommen **keine** eigene `CLAUDE.md` — sie sind
dünne, sich gegenseitig erklärende Dateien ohne eigene Business-Logik; ihr Zusammenspiel mit den
States wird in `src/app/states/CLAUDE.md` mitbeschrieben, weil ein Agent, der eine Action ändert,
ohnehin fast immer auch den zugehörigen State-Reducer anfasst.

## Root-`CLAUDE.md`: Zielformat

Die Root-Datei wird auf zwei Teile reduziert:

1. **Projekterklärung** (kurz, ~15–20 Zeilen): was das Projekt ist, Tech-Stack-Stichworte,
   Build/Test-Befehle, projektweite Konventionen, die für *jede* Änderung gelten (Signals statt
   Decorator-API, `--legacy-peer-deps`, Firestore-Rules bei Datenstruktur-Änderungen mitziehen,
   kleine verifizierbare Schritte). Alles, was heute schon in "Arbeitsweise für Änderungen" steht
   und wirklich immer gilt, bleibt hier.
2. **Index** als Tabelle: Verzeichnis → eigene `CLAUDE.md`? → Kurzbeschreibung (1 Zeile) → Link.
   Damit weiß ein Agent auch bei einer Aufgabe, die mehrere Bereiche berührt, sofort, wohin er
   für Details schauen muss, ohne dass die Root-Datei die Details selbst enthält.

Beispielzeile für den Index:

```
| Verzeichnis                     | CLAUDE.md | Inhalt |
|----------------------------------|-----------|--------|
| `src/app/components/`           | ja        | Smart/Dumb-Muster, OnPush-Voraussetzungen |
| `src/app/components/player-hand/`| ja       | Hotspot — vor Änderungen lesen |
| `src/app/services/`             | ja        | Kein Repository-Layer, Service-Zuständigkeiten |
| `src/app/states/`                | ja        | NGXS-Registrierung, Actions/Selectors-Zusammenspiel |
| `src/models/`                    | ja        | Helden-/Monster-Datenmodell |
| `docs/`                          | ja        | done/ vs. planned/-Konvention |
```

Der Abschnitt "Bekannte Baustellen" wandert inhaltlich in die jeweilige verzeichnis-lokale
`CLAUDE.md` (z.B. Player-Hand-Hotspot in `player-hand/CLAUDE.md`, Firestore-Repository-Lücke in
`services/CLAUDE.md`) — Root behält nur eine Zeile pro Punkt mit Link auf den jeweiligen Plan
unter `docs/planned/`, damit man den Überblick nicht verliert, ohne die Details doppelt zu
pflegen.

## TODOs

- [ ] **TODO 1 — `docs/CLAUDE.md` anlegen**
  - Erklärt die `done/`- vs. `planned/`-Konvention und den Aufbau eines Plans (Diagnose →
    nummerierte TODOs → Verifikation), aktuell nur implizit in der Root-`CLAUDE.md` beschrieben.
  - Kleinster, risikofreier erster Schritt — reine Ergänzung, keine bestehende Datei ändert sich.

- [ ] **TODO 2 — `src/app/states/CLAUDE.md`**
  - Welche States unter `src/app/states/` existieren, welche davon in `app.config.ts` via
    `provideStore([...])` registriert sind (mit dem Hinweis, dass `app.config.ts` die einzige
    Quelle der Wahrheit bleibt und diese Liste veralten kann — Beispiel: der entfernte
    `MobState`, siehe `docs/done/review-2026-08/01-state-management.md`).
  - Zusammenspiel `actions/` → `states/` (Reducer) → `selectors/`/`selectSignal()` an einem
    konkreten Beispiel (z.B. `SetNewEnemy`).
  - Verifikation: Datei liegt unter 200 Zeilen, keine Aussage widerspricht dem aktuellen Inhalt
    von `app.config.ts` (gegenlesen).

- [ ] **TODO 3 — `src/app/services/CLAUDE.md`**
  - Kurzüberblick, welcher Service wofür zuständig ist (Repository-Services vs.
    Business-Logik-Services wie `card-play.service.ts`, `heropower.service.ts`).
  - Bekannte Lücke: kein einheitlicher Error-Interceptor, Verweis auf
    `docs/planned/firestore-repository-service-plan.md` statt Doppelpflege der Diagnose.
  - Verifikation: jeder Service aus `ls src/app/services/*.ts` (ohne `.spec.ts`) kommt mindestens
    einmal namentlich vor.

- [ ] **TODO 4 — `src/app/components/CLAUDE.md`**
  - Smart/Dumb-Container-Konvention (`enemy-container`, `heropower-container`) inkl. Regel, wann
    ein neues Feature diesem Muster folgen soll.
  - OnPush-Voraussetzung ("nur wenn alle Vorfahren auf dem Pfad zur Wurzel OnPush oder
    vollständig signal-basiert sind") mit Link auf `docs/done/onpush-refactor-plan.md` statt
    Wiederholung der Herleitung.
  - Hinweis, dass `startscreen/` weiterhin klassische Firestore-Callbacks mischt (nicht
    pauschal migriert annehmen).
  - Verweis auf die eigene `CLAUDE.md` unter `player-hand/` für den Hotspot.

- [ ] **TODO 5 — `src/app/components/player-hand/CLAUDE.md`**
  - Explizite Hotspot-Warnung (>580 Zeilen, mischt Firestore/NGXS/Spielregeln/UI) direkt an der
    Stelle, wo ein Agent sie am ehesten braucht — bevor er die Datei überhaupt öffnet.
  - Link auf `docs/planned/player-hand-decomposition-plan.md` als Einstiegspunkt für jede
    größere Änderung hier, statt die Diagnose zu duplizieren.

- [ ] **TODO 6 — `src/app/components/enemy/CLAUDE.md`** und
      **`src/app/components/heropower/CLAUDE.md`**
  - Je 10–20 Zeilen: was der Container liest (Store/Firestore) und was die Presenter-Komponente
    rein darstellt, plus das jeweils konkrete Beispiel-File als Referenz für neue
    Container/Presenter-Paare (`heropower-container.component.ts` wird in der Root-`CLAUDE.md`
    bereits als Signal-Pattern-Beispiel genannt — hierher verschieben/verlinken statt duplizieren).

- [ ] **TODO 7 — `src/models/CLAUDE.md`**
  - Helden-Klassen (`src/models/helden/`), `Hero.buildCardstack()`-Dedupliziernug, Monster-Klasse
    + `monster-collection.data.ts`.
  - Link auf `docs/planned/hero-data-model-plan.md` statt erneuter Diagnose der Duplikate.

- [ ] **TODO 8 — Root-`CLAUDE.md` kürzen und Index ergänzen**
  - Erst nachdem TODO 1–7 stehen (sonst zeigt der Index auf nicht existierende Dateien).
  - "Struktur"- und "Bekannte Baustellen"-Abschnitte auf Verweise auf die neuen
    verzeichnis-lokalen Dateien reduzieren, Index-Tabelle (siehe oben) einfügen.
  - Tech-Stack-, Build/Test- und projektweite Arbeitsweise-Abschnitte bleiben unverändert in der
    Root-Datei, da sie für jede Aufgabe relevant sind, unabhängig vom Verzeichnis.
  - Verifikation: Root-`CLAUDE.md` unter ~150 Zeilen; jede in der alten Version enthaltene
    Information ist entweder noch in der Root-Datei (weil projektweit relevant) oder in genau
    einer verzeichnis-lokalen `CLAUDE.md` wiederzufinden — nichts geht verloren, nichts ist
    doppelt.

## Nicht Teil dieses Plans

- Keine inhaltliche Änderung an bestehenden Plänen unter `docs/planned/`/`docs/done/` — diese
  werden nur verlinkt, nicht umgeschrieben.
- Keine Einführung von Import-Syntax (`@pfad/zu/DATEI.md`) innerhalb der `CLAUDE.md`-Dateien,
  weil das Repo klein genug ist, dass eigenständige verzeichnis-lokale Dateien übersichtlicher
  bleiben als eine Import-Kette, und weil importierter Inhalt ohnehin voll in den Kontext
  expandiert wird (kein Context-Sparing-Effekt).
- Kein neuer Ordner, der nicht schon existiert — die Struktur folgt 1:1 der bestehenden
  Verzeichnisaufteilung unter `src/app/` und `src/models/`.

## Verifikation (gesamter Plan)

- Jede neue `CLAUDE.md` unter ~200 Zeilen.
- Root-`CLAUDE.md` enthält keine Detail-Diagnose mehr, die auch in einer verzeichnis-lokalen
  Datei steht (Grep-Stichprobe auf doppelte Kernaussagen).
- Stichprobe: eine neue Session bekommt die Aufgabe, ausschließlich `heropower.service.ts` zu
  ändern — sie sollte dafür nur Root-`CLAUDE.md` + `src/app/services/CLAUDE.md` benötigen, nicht
  die komplette bisherige Root-Datei.
