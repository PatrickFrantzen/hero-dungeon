# CLAUDE.md — hero-dungeon

Kartenbasiertes Multiplayer-Dungeon-Spiel (Web) mit Firebase-Backend. Diese Datei ist die
Orientierung für KI-Assistenten in diesem Repo.

## Tech-Stack (Ist-Zustand)

- **Angular 15** (`@angular/core` ^15.0.0), CLI-Projekt, generiert mit `ng new`.
- **Modul-basiert**, kein Standalone: jede Komponente hat `standalone` nicht gesetzt (=> `false`),
  Deklarationen laufen zentral über `src/app/app.module.ts`. Ein einziges Feature-Modul-Muster
  existiert nicht — alles hängt in `AppModule`.
- **State Management: NGXS** (`@ngxs/store`, `@ngxs/storage-plugin`) — States unter
  `src/app/states/`, Actions unter `src/app/actions/`, Selectors unter `src/app/selectors/`.
  Komponenten lesen State über den `@Select()`-Decorator + manuelles `.subscribe()` /
  `.unsubscribe()` in `ngOnInit`/`ngOnDestroy` (kein `async`-Pipe-Pattern, keine Signals).
- **UI**: Angular Material 15 (`@angular/material`, `@angular/cdk`), Theme
  `purple-green.css` (prebuilt, nicht customized), SCSS pro Komponente.
- **Backend**: Firebase über `@angular/fire` v7 — Firestore (`getFirestore`, `doc`, `getDoc`,
  `setDoc`, `updateDoc` direkt in Komponenten/Services, kein Repository-Layer) und Auth
  (`@angular/fire/auth-guard`, `redirectLoggedInTo` / `redirectUnauthorizedTo` in der Routing-
  Konfiguration). Firebase-Config liegt in `src/environments/environment*.ts` (Web-API-Key ist
  öffentlich und für Firebase üblich — Absicherung erfolgt ausschließlich über Firestore
  Security Rules, siehe Issues).
- **Tests**: Karma + Jasmine (`ng test`), ein `.spec.ts` pro Komponente/Service — die meisten
  sind das generierte Grundgerüst ("should create") ohne echte Assertions zum Verhalten.
- **TypeScript**: `strict: true`, Target `ES2022`, aber `typescript: ~4.8.2` (durch Angular-15-
  Peer-Dependency-Range begrenzt).

## Struktur

```
src/app/
  actions/       NGXS-Actions (ein File pro Feature-State)
  selectors/     NGXS-Selectors
  states/        NGXS-States
  services/      Firestore-Zugriff, teils Business-Logik (z.B. Karten ziehen)
  components/    Feature-Komponenten, meist "smart" (State+Firestore+Template gemischt);
                 enemy/ und heropower/ haben je einen *-container/ Unterordner
                 (Ansatz zu Smart/Dumb-Trennung, seit Commit e704eb2, noch nicht durchgängig)
src/models/
  helden/        Eine Klasse pro Heldentyp (barbar, dieb, gladiator, ...) + hero.class.ts,
                 card.class.ts
  monster/       monster.class.ts
  game.ts, user.class.ts
src/assets/img/  Karten-, Icon-, Monster-Token-Grafiken
```

## Bekannte Baustellen (Ist-Zustand, nicht normativ)

- Komponenten wie `game.component.ts` mischen Firestore-Zugriff, NGXS-Dispatch und
  UI-Logik in einer Klasse (>150 Zeilen, viele Verantwortlichkeiten).
- Kein Interceptor/Guard-Layer um Firestore-Fehler — `getDoc`/`updateDoc`-Aufrufe ohne
  try/catch, kein Error-Handling im UI bei Verbindungsproblemen.
- Deutsche und englische Bezeichner gemischt (`heropower-selector.ts` vs. `Heldenfähigkeiten`
  in Commit-Messages) — beim Umbau nicht zusätzlich vereinheitlichen, wenn nicht explizit
  beauftragt.
- Kein CI-Workflow (`.github/` existiert nicht), keine Lint-Konfiguration im Projekt.

## Arbeitsweise für Änderungen

- **Kleine, verifizierbare Schritte.** Bei einem großen Umbau (z.B. Standalone-/Signal-
  Migration) Issues/Schritte einzeln abarbeiten, nach jedem Schritt `ng build` und
  `ng test` grün halten, nicht in einem Rutsch alles umstellen.
- **Firebase-Credentials**: `environment.ts`/`environment.prod.ts` enthalten den Firebase-
  Web-API-Key. Das ist bei Firebase kein Geheimnis, das per Security Rules abgesichert wird —
  trotzdem keine anderen Secrets (Service-Account-Keys, Admin-SDK-Credentials) hier ablegen.
- **Keine Breaking-Change-Sprünge bei Angular:** Majorversionen einzeln hochziehen
  (`ng update @angular/core@<next-major> @angular/cli@<next-major>`), nicht direkt auf die
  neueste Version springen — Angular unterstützt offiziell nur Update um jeweils eine
  Hauptversion.
- Vor Formatierungs-/Lint-Änderungen: es gibt aktuell keine ESLint/Prettier-Konfiguration in
  diesem Repo — vor deren Einführung kurz abstimmen (Scope, Regelset).
