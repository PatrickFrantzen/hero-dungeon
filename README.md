# Hero Dungeon

Kartenbasiertes Multiplayer-Dungeon-Spiel im Browser, angelehnt an die Regeln von
"5 Minute Dungeon". Bis zu vier Spieler ziehen gemeinsam durch einen Dungeon,
bekämpfen Monster über Symbol-Karten und Heldenfähigkeiten, gegen einen Fünf-Minuten-Timer.
Singleplayer läuft komplett lokal, Multiplayer synchronisiert sich in Echtzeit über Firebase.

**Live-Demo:** https://patrickfrantzen.github.io/hero-dungeon/

## Screenshots

<!-- TODO: Screenshot/GIF vom Spielbrett (game.component) und von der Handkarten-Ansicht
     (player-hand.component) hier einfügen, bevor das README veröffentlicht wird. -->

## Tech-Stack

- **Angular 21** — Standalone Components durchgängig, kein `NgModule`
- **Signals** statt Decorator-API (`input()`, `output()`, `computed()`, `effect()`)
- **NGXS** für State-Management, inkl. `@ngxs/storage-plugin` für lokale Persistenz
- **Firebase** (Firestore + Auth) über `@angular/fire` — Echtzeit-Sync für Multiplayer,
  abgesichert über Firestore Security Rules (eigenes Testsuite mit dem Firestore-Emulator)
- **Angular Material** + **Tailwind CSS** als Utility-Layer
- **Karma/Jasmine** für Unit-Tests, CI über GitHub Actions

## Architektur-Highlights

- Klare Trennung von Firestore-Zugriff (Repository-Services) und Spielregel-Logik
  (Business-Logik-Services) — siehe [`src/app/services/CLAUDE.md`](src/app/services/CLAUDE.md)
- NGXS-States pro Feature statt einem monolithischen Store —
  siehe [`src/app/states/CLAUDE.md`](src/app/states/CLAUDE.md)
- Firestore Security Rules mit eigener Testsuite (`firestore.rules.test.js`,
  `npm run test:rules`, läuft gegen den lokalen Firestore-Emulator)
- Zwei parallele Deployments über GitHub Pages: `main` → Produktion,
  `dev` → Vorschau-Umgebung (`.github/workflows/deploy-pages*.yml`)
- Ausführliche, verzeichnis-lokale Architekturdokumentation (`CLAUDE.md`-Dateien) für
  jeden größeren Codebereich, inkl. dokumentierter Refactoring-Historie unter `docs/`

## Lokale Entwicklung

```bash
npm ci --legacy-peer-deps   # --legacy-peer-deps: @angular/fire-Peer-Range passt nicht exakt
ng serve                     # http://localhost:4200
```

Eigene Firebase-Zugangsdaten werden in `src/environments/environment.ts` hinterlegt
(der Web-API-Key ist kein Geheimnis, die Absicherung erfolgt über Firestore Security Rules).

### Tests

```bash
ng test --watch=false --browsers=ChromeHeadlessCI   # Unit-Tests
npm run test:rules                                   # Firestore Security Rules (braucht Java)
```

### Lint & Format

```bash
npm run lint           # ESLint (@angular-eslint)
npm run format         # Prettier, schreibt
npm run format:check   # Prettier, nur prüfen
```

## Projektstruktur

```
src/app/
  actions/     NGXS-Actions
  selectors/   NGXS-Selectors
  states/      NGXS-States
  services/    Firestore-Zugriff + Spielregel-Logik
  components/  Feature-Komponenten (Standalone)
src/models/    Domänenmodell (Helden, Monster, Spiel, User)
docs/          Refactoring-/Umsetzungspläne (done/planned)
```

Details zu einzelnen Bereichen stehen in den verzeichnis-lokalen `CLAUDE.md`-Dateien,
Startpunkt ist die [Root-`CLAUDE.md`](CLAUDE.md).
