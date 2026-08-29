# CLAUDE.md — hero-dungeon

Kartenbasiertes Multiplayer-Dungeon-Spiel (Web) mit Firebase-Backend. Diese Datei ist die
Orientierung für KI-Assistenten in diesem Repo. Stand: 2026-08-29 (letzter geprüfter Commit
`22c7461`). Diese Datei wird nicht automatisch aktuell gehalten — bei größeren Umbauten (Angular-
Major-Update, Store-Wechsel, neue Architektur-Entscheidung) bitte hier nachziehen.

## Tech-Stack (Ist-Zustand)

- **Angular 21** (`@angular/core` ^21.2.22), CLI-Projekt. Über die offizielle `ng update`-Kette
  schrittweise von Angular 15 hochgezogen (siehe `git log`, u.a. PR #13).
- **Standalone durchgängig**, kein `NgModule`: keine `app.module.ts` mehr, Bootstrapping über
  `src/main.ts` + `src/app/app.config.ts` (`ApplicationConfig`, `bootstrapApplication`), Routing
  über `src/app/app.routes.ts`. Jede Komponente deklariert ihre Imports selbst im
  `@Component({ imports: [...] })`-Array.
- **Signals statt Decorator-API, wo migriert:**
  - `@Input()` → `input()`/`input.required()` (PR #16).
  - `@Select()` + manuelles `.subscribe()`/`.unsubscribe()` → `store.selectSignal(...)` (PR #15).
    Kein `async`-Pipe-Pattern für Store-Reads mehr nötig.
  - Abgeleitete Werte über `computed()`, Seiteneffekte (z.B. auf Firestore schreiben, sobald sich
    ein Signal ändert) über `effect()` — siehe `heropower-container.component.ts` als Beispiel.
  - Kind→Eltern-Kommunikation über `output()` (die Signal-basierte Alternative zu
    `@Output()`/`EventEmitter`), z.B. `HeropowerContainerComponent.heropowerResolved`.
  - `ChangeDetectionStrategy.OnPush` ist auf den meisten Komponenten gesetzt (PR #17, #19). Eine
    Komponente kann nur dann OnPush sein, wenn auch alle ihre Eltern auf dem Pfad zur Wurzel
    entweder OnPush oder vollständig signal-basiert sind — Details und ein Beispiel für den
    entsprechenden Diagnose-/Umsetzungsprozess in `docs/done/onpush-refactor-plan.md`.
  - Nicht alles ist migriert: einzelne Komponenten (`StartscreenComponent`,
    `PlayerHandComponent`) mischen weiterhin klassische Firestore-`onSnapshot`/`getDoc`-Callbacks
    mit Signal-Reads. Beim Anfassen eines Files auf den tatsächlichen Code schauen, nicht
    pauschal "ist schon migriert" annehmen.
- **State Management: NGXS** (`@ngxs/store`, `@ngxs/storage-plugin`) — weiterhin im Einsatz,
  auch nach der Signals-Migration (NGXS und Signals schließen sich nicht aus: `selectSignal()`
  ist NGXS' eigene Signal-Schnittstelle). States unter `src/app/states/`, Actions unter
  `src/app/actions/`, Selectors unter `src/app/selectors/`. Registrierung zentral in
  `app.config.ts` über `provideStore([...])` — Registrierung dort ist die einzige Quelle der
  Wahrheit, welcher State tatsächlich aktiv ist (ein früherer nicht registrierter `MobState`
  wurde deswegen entfernt, siehe `docs/done/review-2026-08/01-state-management.md`).
- **UI**: Angular Material 21 (`@angular/material`, `@angular/cdk`), Theme `purple-green.css`
  (prebuilt, nicht customized), SCSS pro Komponente.
- **Backend**: Firebase über `@angular/fire` v20 — Firestore (`getFirestore`, `doc`, `getDoc`,
  `setDoc`, `updateDoc` direkt in Komponenten/Services, kein Repository-Layer) und Auth
  (`@angular/fire/auth-guard`, `redirectLoggedInTo`/`redirectUnauthorizedTo` in
  `app.routes.ts`). Firebase-Config liegt in `src/environments/environment*.ts` (Web-API-Key ist
  öffentlich und für Firebase üblich — Absicherung erfolgt über Firestore Security Rules, siehe
  nächster Punkt).
- **Firestore Security Rules**: `firestore.rules` + `firestore.rules.test.js`
  (`@firebase/rules-unit-testing`, `npm run test:rules` startet dafür den Firestore-Emulator via
  `firebase emulators:exec`). Eingeführt in PR #12 — bei Änderungen an der Firestore-
  Datenstruktur (neue Collections/Felder) die Rules und ihre Tests mitziehen.
- **CI**: `.github/workflows/ci.yml` (GitHub Actions, seit PR #11) mit zwei Jobs:
  `build-and-test` (`npm ci --legacy-peer-deps`, `ng build`, `ng test --watch=false
  --browsers=ChromeHeadlessCI`) und `firestore-rules` (`npm run test:rules`, braucht Java für den
  Emulator). `--legacy-peer-deps` ist nötig, weil `@angular/fire`s Peer-Range nicht exakt zur
  installierten Angular-Version passt — ein normales `npm install`/`npm ci` schlägt sonst fehl.
- **Tests lokal ausführen**: `ng test` startet standardmäßig `ChromeHeadless`, was als `root`
  (z.B. in einer Container-/CI-Umgebung ohne eigenen Nutzer) mit
  `Running as root without --no-sandbox is not supported` fehlschlägt. `karma.conf.js` definiert
  dafür bereits einen `ChromeHeadlessCI`-Launcher mit `--no-sandbox --disable-gpu` — lokal/in
  Agentenumgebungen also `ng test --watch=false --browsers=ChromeHeadlessCI` verwenden (ggf. mit
  `CHROME_BIN` auf einen vorhandenen Chromium/Chrome-Pfad, falls kein System-Chrome installiert
  ist).
- **TypeScript**: `strict: true` plus verschärfte Compiler-Optionen
  (`noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`,
  `noFallthroughCasesInSwitch`, `strictTemplates`), Target/Module `ES2022`, `typescript: ~5.9.3`
  (nicht mehr durch eine alte Angular-15-Peer-Range begrenzt).
- **Lint/Format**: weiterhin keine ESLint/Prettier-Konfiguration im Projekt — vor deren
  Einführung kurz abstimmen (Scope, Regelset), wie schon zuvor.

## Struktur

```
src/app/
  actions/       NGXS-Actions (ein File pro Feature-State)
  selectors/     NGXS-Selectors
  states/        NGXS-States (Achtung: nicht jeder State ist in app.config.ts registriert)
  services/      Firestore-Zugriff, teils Business-Logik (z.B. Karten ziehen); kein
                 Repository-Layer, viel Boilerplate-Duplikation zwischen den Services
  components/    Feature-Komponenten, meist standalone + signal-basiert; enemy/ und
                 heropower/ haben je einen *-container/ Unterordner (Smart/Dumb-Trennung,
                 seit Commit e704eb2 — Container liest Store/Firestore, Kind-Komponente ist
                 reine Darstellung); dieses Muster ist noch nicht durchgängig, größter
                 verbleibender Ausreißer ist PlayerHandComponent (>580 Zeilen, siehe unten)
  app.config.ts  Zentrale Provider-Konfiguration (Router, Firebase, NGXS-Store)
  app.routes.ts  Routing inkl. Auth-Guards
src/models/
  helden/        Eine Klasse pro Heldentyp (barbar, dieb, gladiator, ...) + hero.class.ts,
                 card.class.ts — der Konstruktor-Rumpf ist über `Hero.buildCardstack()`
                 dedupliziert (siehe docs/done/hero-data-model-plan.md), aber weiterhin
                 zehn Klassen mit teils identischen Kartendaten statt einem Datenmodell
  monster/       monster.class.ts (Auswahl-/Schwierigkeitslogik, ~130 Zeilen) +
                 monster-collection.data.ts (Datenliterale, ausgelagert)
  game.ts, user.class.ts
src/assets/img/  Karten-, Icon-, Monster-Token-Grafiken
docs/
  done/          Abgeschlossene/laufende Refactoring-Pläne im gleichen Stil wie diese Datei,
                 u.a. das vollständige Code-Review vom 2026-08 (jetzt unter
                 `done/review-2026-08/`, 00-overview.md als Einstieg) und die daraus
                 hervorgegangenen Pläne für die noch offenen strukturellen Umbauten
                 (`firestore-repository-service-plan.md`, `currentGame-state-split-plan.md`,
                 `player-hand-decomposition-plan.md`, `hero-data-model-plan.md`,
                 `dialog-auth-unification-plan.md`)
```

## Bekannte Baustellen (Ist-Zustand, nicht normativ)

Ein vollständiges, datei-für-Datei-Review mit `datei.ts:Zeile`-Belegen liegt unter
`docs/done/review-2026-08/` (Einstieg: `docs/done/review-2026-08/00-overview.md`). Die
klein-/mittelgroßen Befunde daraus sind bereits umgesetzt (PR #21, siehe Status-Abschnitt in
jeder Einzeldatei); die verbleibenden Punkte unten sind als eigene Umsetzungspläne unter
`docs/done/*-plan.md` vorbereitet — Einstieg für eine neue Session ist jeweils der verlinkte
Plan, nicht mehr das ursprüngliche Review.

- `PlayerHandComponent` (`src/app/components/player-hand/player-hand.component.ts`, >580
  Zeilen) mischt weiterhin Firestore-Zugriff, NGXS-Dispatch, Spielregeln und UI in einer Klasse
  — der zentrale Hotspot im Projekt, bewusst nicht Teil des OnPush-Refactors
  (`docs/done/onpush-refactor-plan.md`), da eigenständiges größeres Vorhaben. Plan:
  `docs/done/player-hand-decomposition-plan.md` (inkl. Heropower-Strategy-Pattern für die
  redundanten Heropower-Check-Methoden als Stretch-Goal).
- Kein Interceptor/Repository-Layer um Firestore-Fehler — `getDoc`/`updateDoc`-Aufrufe
  größtenteils ohne try/catch. Plan: `docs/done/firestore-repository-service-plan.md`.
- `currentGame-state.ts` bündelt vier fachlich unabhängige Verantwortlichkeiten (Spiel-
  Identität, Gegner/Encounter, Lobby/Spieler, Quest-Flag) in einem NGXS-State. Plan:
  `docs/done/currentGame-state-split-plan.md`.
- Die zehn Heldenklassen unter `src/models/helden/` haben identische Kartendaten in mehreren
  Paaren (z.B. Barbar/Gladiator) und tragen keine unterscheidbare Verhaltenslogik — ein
  datengetriebener Ansatz (Konfigurationsobjekte + Factory) wäre SOLID-konformer als zehn
  Klassen. Der Konstruktor-Rumpf selbst ist bereits über `Hero.buildCardstack()` dedupliziert.
  Plan: `docs/done/hero-data-model-plan.md`.
- `StartscreenComponent`, die drei Dialog-Komponenten und Signin/Signup haben überlappende
  Verantwortung (Spiellogik/Firestore-Zugriff in der Komponente statt im Service, dupliziertes
  `MatDialogRef`-Boilerplate, kein gemeinsamer Auth-Fehler-Mapper). Plan:
  `docs/done/dialog-auth-unification-plan.md`.
- Deutsche und englische Bezeichner gemischt (`heropower-selector.ts` vs. `Heldenfähigkeiten`
  in Commit-Messages) — beim Umbau nicht zusätzlich vereinheitlichen, wenn nicht explizit
  beauftragt.
- Firestore-Zugriffs-Boilerplate (`doc(this.db, 'games', gameId, ...)` + `updateDoc(...)`) ist
  über mehrere Services und Komponenten dupliziert statt in einer gemeinsamen Abstraktion
  gebündelt (siehe `firestore-repository-service-plan.md`).

## Arbeitsweise für Änderungen

- **Kleine, verifizierbare Schritte.** Bei einem größeren Umbau (z.B. Entflechtung von
  `PlayerHandComponent`, Umstellung der Heldenklassen auf Konfigurationsdaten) Schritte einzeln
  abarbeiten, nach jedem Schritt `ng build` und `ng test --watch=false
  --browsers=ChromeHeadlessCI` grün halten, nicht in einem Rutsch alles umstellen. Der Stil aus
  `docs/done/onpush-refactor-plan.md` (Diagnose → nummerierte TODOs → Verifikation) ist die
  Referenz für neue Refactoring-Pläne.
- Vor einem größeren Refactoring lohnt ein Blick in `docs/done/*-plan.md` bzw.
  `docs/done/review-2026-08/`, ob der betroffene Codeteil dort bereits mit konkreten Befunden,
  einer Diagnose und nummerierten TODOs dokumentiert ist — dann darauf aufbauen statt neu zu
  analysieren.
- **Firebase-Credentials**: `environment.ts`/`environment.prod.ts` enthalten den Firebase-
  Web-API-Key. Das ist bei Firebase kein Geheimnis, das per Security Rules abgesichert wird —
  trotzdem keine anderen Secrets (Service-Account-Keys, Admin-SDK-Credentials) hier ablegen.
  Änderungen an der Firestore-Datenstruktur immer zusammen mit `firestore.rules` und
  `firestore.rules.test.js` betrachten.
- **Keine Breaking-Change-Sprünge bei Angular:** Majorversionen einzeln hochziehen
  (`ng update @angular/core@<next-major> @angular/cli@<next-major>`), nicht direkt auf die
  neueste Version springen — Angular unterstützt offiziell nur Update um jeweils eine
  Hauptversion. `npm install`/`npm ci` in diesem Repo aktuell mit `--legacy-peer-deps`
  ausführen (siehe CI-Job oben).
- Vor Formatierungs-/Lint-Änderungen: es gibt aktuell keine ESLint/Prettier-Konfiguration in
  diesem Repo — vor deren Einführung kurz abstimmen (Scope, Regelset).
- Bei neuen Komponenten/Services das bereits etablierte Signal-Pattern verwenden
  (`input()`, `output()`, `store.selectSignal()`, `computed()`, `effect()`,
  `ChangeDetectionStrategy.OnPush`) statt zur älteren Decorator-/`@Select()`-API
  zurückzufallen.
