# CLAUDE.md — hero-dungeon

Kartenbasiertes Multiplayer-Dungeon-Spiel (Web) mit Firebase-Backend. Diese Datei ist die
projektweite Orientierung für KI-Assistenten in diesem Repo — Details zu einzelnen Bereichen
stehen in den verzeichnis-lokalen `CLAUDE.md`-Dateien aus dem Index unten, nicht hier. Stand:
2026-08-29. Diese Datei wird nicht automatisch aktuell gehalten.

**Pflicht bei jeder Änderung: die betroffene(n) `CLAUDE.md`-Datei(en) mitpflegen.** Wer eine
Komponente/einen Service/State/ein Modell ändert, das in einer verzeichnis-lokalen `CLAUDE.md`
beschrieben ist, aktualisiert diese Beschreibung im selben Schritt (neuer Service → in
`services/CLAUDE.md` eintragen, State-Umbau → `states/CLAUDE.md` anpassen, Plan abgeschlossen →
in `docs/CLAUDE.md`-Konvention von `planned/` nach `done/` verschieben und verlinkende Stellen
korrigieren, usw.). Ein neues Verzeichnis mit eigenständiger Verantwortung bekommt eine eigene
`CLAUDE.md` plus einen neuen Eintrag im Index unten — sonst veraltet die Doku genauso schnell
wie vorher die eine große Datei, nur jetzt an mehr Stellen gleichzeitig.

## Index — wo stehen die Details

Claude Code lädt verzeichnis-lokale `CLAUDE.md`-Dateien automatisch nach, sobald eine Datei aus
diesem Verzeichnis gelesen/bearbeitet wird — dafür ist diese Tabelle da, nicht zum Ersatzlesen.

| Verzeichnis | Inhalt der dortigen `CLAUDE.md` |
|---|---|
| `docs/` | `done/`- vs. `planned/`-Konvention, wie ein neuer Plan aufgebaut wird |
| `src/app/components/` | Smart/Dumb-Muster, OnPush-Voraussetzung, Migrationsstand, Dialog-Basisklasse |
| `src/app/components/game/` | GameComponent (Host) + Dungeon-Timer-Feature (über mehrere Verzeichnisse verteilt) |
| `src/app/components/player-hand/` | Hotspot-Komponente — vor Änderungen lesen |
| `src/app/components/enemy/` | Container/Presenter-Paar für den Gegner-Screen |
| `src/app/components/heropower/` | Container/Presenter-Paar für Heldenfähigkeiten |
| `src/app/components/tutorial/` | Interaktives Onboarding-Overlay (Issue #54, abgeschlossen) |
| `src/app/services/` | Repository- vs. Business-Logik-Services, welcher Service wofür zuständig ist |
| `src/app/states/` | NGXS-States, Registrierung, Zusammenspiel actions/states/selectors |
| `src/models/` | Helden-/Monster-/Spiel-Datenmodell |

`src/app/actions/` und `src/app/selectors/` haben keine eigene `CLAUDE.md` (zu dünn ohne eigene
Logik) — mitbeschrieben in `src/app/states/CLAUDE.md`. `firestore.rules` +
`firestore.rules.test.js` sind kurz genug, um ohne eigene `CLAUDE.md` direkt gelesen zu werden.

## Tech-Stack (Ist-Zustand, projektweit)

- **Angular 21** (`@angular/core` ^21.2.22), CLI-Projekt.
- **Standalone durchgängig**, kein `NgModule`: Bootstrapping über `src/main.ts` +
  `src/app/app.config.ts` (`ApplicationConfig`, `bootstrapApplication`), Routing über
  `src/app/app.routes.ts`. Jede Komponente deklariert ihre Imports selbst im
  `@Component({ imports: [...] })`-Array.
- **Signals statt Decorator-API, wo migriert:** `@Input()` → `input()`/`input.required()`;
  `@Select()` + `.subscribe()` → `store.selectSignal(...)`; abgeleitete Werte über `computed()`,
  Seiteneffekte über `effect()`; Kind→Eltern-Kommunikation über `output()`. Nicht alles ist
  migriert — beim Anfassen eines Files immer den tatsächlichen Code ansehen, nicht pauschal "ist
  schon migriert" annehmen (Details je Bereich in den verzeichnis-lokalen `CLAUDE.md`-Dateien).
- **State Management: NGXS** (`@ngxs/store`, `@ngxs/storage-plugin`) — schließt Signals nicht
  aus (`selectSignal()` ist NGXS' eigene Signal-Schnittstelle). Details: `src/app/states/CLAUDE.md`.
- **UI**: Angular Material 21 (`@angular/material`, `@angular/cdk`), Theme `purple-green.css`
  (prebuilt, nicht customized), SCSS pro Komponente. Seit 2026-08-30 zusätzlich **Tailwind CSS
  v3** als Utility-Layer (geprefixt `tw-`, `preflight` deaktiviert) für Screens ohne
  Material-Komponenten — Details/Migrationsstand: `src/app/components/CLAUDE.md`. Seit
  2026-09-02 zusätzlich **Cinzel** (Google Font, `index.html`) als Fantasy-Serife für
  Überschriften/Titel (`--font-heading`-CSS-Variable, `src/styles.scss`) — Fließtext bleibt
  Roboto, Details: `src/app/components/CLAUDE.md`.
- **Backend**: Firebase über `@angular/fire` v20 — Firestore und Auth
  (`@angular/fire/auth-guard`, `redirectLoggedInTo`/`redirectUnauthorizedTo` in
  `app.routes.ts`). Firebase-Config liegt in `src/environments/environment*.ts` (Web-API-Key ist
  öffentlich und für Firebase üblich — Absicherung erfolgt über Firestore Security Rules).
- **Firestore Security Rules**: `firestore.rules` + `firestore.rules.test.js`
  (`@firebase/rules-unit-testing`, `npm run test:rules` startet den Firestore-Emulator via
  `firebase emulators:exec`). Bei Änderungen an der Firestore-Datenstruktur (neue
  Collections/Felder) die Rules und ihre Tests mitziehen.
- **CI**: `.github/workflows/ci.yml` mit zwei Jobs: `build-and-test` (`npm ci
  --legacy-peer-deps`, `ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI`) und
  `firestore-rules` (`npm run test:rules`, braucht Java für den Emulator).
  `--legacy-peer-deps` ist nötig, weil `@angular/fire`s Peer-Range nicht exakt zur installierten
  Angular-Version passt.
- **Deployment: GitHub Pages** (`.github/workflows/deploy-pages.yml` + `deploy-pages-dev.yml`),
  Ziel-Branch für beide `gh-pages`. Push auf `main` deployt Prod nach
  `https://<owner>.github.io/hero-dungeon/` (Root der `gh-pages`-Branch), Push auf `dev` deployt
  eine Vorschau nach `https://<owner>.github.io/hero-dungeon/dev/` (Unterordner, `destination_dir:
  dev`) — beide Jobs setzen `keep_files: true`, sonst würde `peaceiris/actions-gh-pages` bei
  jedem Deploy den jeweils anderen Inhalt der `gh-pages`-Branch mit löschen. Beide nutzen dieselbe
  Firebase-Instanz wie Prod (`environment.ts`/`environment.prod.ts` zeigen auf dasselbe
  Firebase-Projekt `hero-dungeon`, keine separate Dev-Datenbank — bewusste Entscheidung,
  Abstimmung mit Patrick, 2026-09-03). Firebase Auth braucht dafür keine zusätzliche autorisierte
  Domain, da beide URLs unter derselben Domain `<owner>.github.io` liegen.
- **Tests lokal ausführen**: `ng test` startet standardmäßig `ChromeHeadless`, was als `root`
  (Container-/Agentenumgebung ohne eigenen Nutzer) fehlschlägt. `karma.conf.js` definiert dafür
  `ChromeHeadlessCI` (`--no-sandbox --disable-gpu`) — also `ng test --watch=false
  --browsers=ChromeHeadlessCI` verwenden (ggf. `CHROME_BIN` setzen, falls kein System-Chrome
  installiert ist).
- **TypeScript**: `strict: true` plus verschärfte Compiler-Optionen (`noImplicitOverride`,
  `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`,
  `strictTemplates`), Target/Module `ES2022`, `typescript: ~5.9.3`.
- **Lint/Format**: keine ESLint/Prettier-Konfiguration im Projekt — vor deren Einführung kurz
  abstimmen (Scope, Regelset).
- **Agent-Skills**: `.claude/skills/` enthält seit 2026-09-04 zusätzlich zu den eingebauten
  Claude-Code-Skills eine editierbare Kopie der `engineering`-/`productivity`-/`in-progress`-
  Skills aus [mattpocock/skills](https://github.com/mattpocock/skills) (MIT) — Details/Update-
  Hinweis: `.claude/skills/README.md`.

## Struktur (Übersicht — Details siehe Index oben)

```
src/app/
  actions/       NGXS-Actions (ein File pro Feature-State)
  selectors/     NGXS-Selectors
  states/        NGXS-States → states/CLAUDE.md
  services/      Firestore-Zugriff + Business-Logik → services/CLAUDE.md
  components/    Feature-Komponenten → components/CLAUDE.md
  app.config.ts  Zentrale Provider-Konfiguration (Router, Firebase, NGXS-Store) — einzige
                 Quelle der Wahrheit, welche States tatsächlich registriert sind
  app.routes.ts  Routing inkl. Auth-Guards
src/models/      Domänen-Modell (Helden, Monster, Game, User) → models/CLAUDE.md
src/assets/img/  Karten-, Icon-, Monster-Token-Grafiken
docs/            Refactoring-/Umsetzungspläne (done/planned) → docs/CLAUDE.md
```

## Bekannte Baustellen (Ist-Zustand, nicht normativ)

Aktuelle Diagnosen und TODOs stehen in den einzelnen `docs/planned/*-plan.md`-Dateien
(Konvention: `docs/CLAUDE.md`) bzw. in der jeweils zuständigen verzeichnis-lokalen `CLAUDE.md`
(z.B. Player-Hand-Hotspot in `src/app/components/player-hand/CLAUDE.md`). Root-`CLAUDE.md` hält
hier nur noch fest, welche größeren Themen offen sind, nicht mehr die Details:

- Player-Hand-Komponente: `docs/planned/player-hand-decomposition-plan.md`
- Firestore-Fehlerbehandlung/Repository-Layer: `docs/done/firestore-repository-service-plan.md`
- `currentGame-state.ts`-Aufteilung: `docs/planned/currentGame-state-split-plan.md`
- Heldendatenmodell: `docs/done/hero-data-model-plan.md`
- Dialog-/Auth-Vereinheitlichung: `docs/done/dialog-auth-unification-plan.md`
- Singleplayer-Modus: `docs/planned/singleplayer-mode-plan.md`
- Login-Umbau beschlossen (2026-09-04): kein Login-Zwang mehr vor dem Startscreen, Singleplayer
  läuft künftig komplett lokal (mehrere parallele Spielstände, Account-Angebot erst beim
  Spielende), Multiplayer wird anonym mit 7-Tage-Ablauf ab letzter Aktivität startbar, plus
  neues In-Game-Menü (Speichern/Spielstände laden/Verlassen): `docs/planned/login-multiplayer-onboarding-plan.md`
- Mehrspieler-Regelkern war an mehreren Stellen von der offiziellen "5 Minute Dungeon"-Anleitung
  abgewichen — alle 11 TODOs aus `docs/done/five-minute-dungeon-rules-plan.md` sind umgesetzt.
  Zwei Punkte bleiben bewusst offen (siehe Status-Abschnitt im Plan): der Zwei-Karten-Reveal-
  Mechanismus der Ereigniskarte "Hinterhalt" und die zweite, komplexere Verlustbedingung
  ("Gruppe kann die geforderten Symbole nicht mehr aufbringen") — beide als eigene Folge-Arbeit
  vorgesehen, kein aktiver Plan dafür.
- App war nicht responsive (kein `@media` im Projekt, feste Pixel-Positionierung v.a. in
  `player-hand`/`heropower`): `docs/done/responsive-design-plan.md` — Layout auf
  Flexbox/`clamp()` umgestellt, voller Multiplayer-Smoke-Test mit Firebase-Login steht laut
  Status-Abschnitt im Plan noch aus. Folgearbeit "fühlt sich mobil wie ein Spiel an" (Touch-
  Härtung, Safe-Area, Handkarten als fixe Fächer-Leiste u.a.):
  `docs/planned/mobile-native-feel-plan.md` — Stufe A (inkl. PWA-Manifest, Issue #46) + TODO 7
  umgesetzt, restliche offene Punkte (Querformat, Heropower-FAB, Kartenstapel-Zähler, Haptik,
  Swipe-Geste) als GitHub Issues #47–#52 getrackt, siehe Referenzen-Abschnitt im Plan.
- Interaktives In-Game-Tutorial ([Issue #54](https://github.com/PatrickFrantzen/hero-dungeon/issues/54)) ist **abgeschlossen** — alle 5 PRs (Grundgerüst, Inhalte für
  alle sieben Stationen, Auto-Trigger beim ersten Singleplayer-Spiel) umgesetzt, Plan nach
  `docs/done/tutorial-plan.md` verschoben. Details: `src/app/components/tutorial/CLAUDE.md`.
- Deutsche und englische Bezeichner gemischt (`heropower-selector.ts` vs. `Heldenfähigkeiten`
  in Commit-Messages) — beim Umbau nicht zusätzlich vereinheitlichen, wenn nicht explizit
  beauftragt.

Ein Plan unter `docs/planned/` kann inzwischen bereits (teilweise) umgesetzt sein — dort steht
ein `## Status`-Abschnitt mit dem aktuellen Stand; vor der Arbeit daran immer erst diesen Status
lesen, nicht nur die ursprüngliche Diagnose.

## Arbeitsweise für Änderungen

- **Kleine, verifizierbare Schritte.** Bei einem größeren Umbau Schritte einzeln abarbeiten,
  nach jedem Schritt `ng build` und `ng test --watch=false --browsers=ChromeHeadlessCI` grün
  halten, nicht in einem Rutsch alles umstellen. Der Stil aus `docs/done/onpush-refactor-plan.md`
  (Diagnose → nummerierte TODOs → Verifikation) ist die Referenz für neue Refactoring-Pläne
  (siehe `docs/CLAUDE.md`).
- Vor einem größeren Refactoring lohnt ein Blick in `docs/planned/*-plan.md` bzw. die
  zuständige verzeichnis-lokale `CLAUDE.md`, ob der betroffene Codeteil dort bereits mit
  konkreten Befunden und nummerierten TODOs dokumentiert ist — dann darauf aufbauen statt neu zu
  analysieren.
- **`CLAUDE.md`-Dateien mitpflegen** (siehe Pflicht-Hinweis oben) — das gilt für jede Änderung,
  nicht nur für größere Umbauten.
- **Firebase-Credentials**: `environment.ts`/`environment.prod.ts` enthalten den Firebase-
  Web-API-Key (kein Geheimnis, wird über Firestore Security Rules abgesichert) — trotzdem keine
  anderen Secrets (Service-Account-Keys, Admin-SDK-Credentials) hier ablegen. Änderungen an der
  Firestore-Datenstruktur immer zusammen mit `firestore.rules` und `firestore.rules.test.js`
  betrachten.
- **Keine Breaking-Change-Sprünge bei Angular:** Majorversionen einzeln hochziehen
  (`ng update @angular/core@<next-major> @angular/cli@<next-major>`), nicht direkt auf die
  neueste Version springen. `npm install`/`npm ci` in diesem Repo aktuell mit
  `--legacy-peer-deps` ausführen (siehe CI-Job oben).
- Vor Formatierungs-/Lint-Änderungen: es gibt aktuell keine ESLint/Prettier-Konfiguration in
  diesem Repo — vor deren Einführung kurz abstimmen (Scope, Regelset).
- Bei neuen Komponenten/Services das bereits etablierte Signal-Pattern verwenden (`input()`,
  `output()`, `store.selectSignal()`, `computed()`, `effect()`, `ChangeDetectionStrategy.OnPush`)
  statt zur älteren Decorator-/`@Select()`-API zurückzufallen.

## Agent skills

### Issue tracker

Issues leben in GitHub Issues (github.com/PatrickFrantzen/hero-dungeon), Zugriff über die
`gh`-CLI. Siehe `docs/agents/issue-tracker.md`.

### Triage labels

Standard-Label-Vokabular unverändert übernommen (`needs-triage`, `needs-info`,
`ready-for-agent`, `ready-for-human`, `wontfix`). Siehe `docs/agents/triage-labels.md`.

### Domain docs

Single-Context-Layout (`CONTEXT.md` + `docs/adr/` am Repo-Root — `docs/adr/` existiert noch
nicht, wird von `/domain-modeling` bei Bedarf angelegt). Siehe `docs/agents/domain.md`.
