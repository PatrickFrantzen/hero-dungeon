# docs/ — Konvention für Refactoring-/Umsetzungspläne

Zwei Ordner, ein gemeinsamer Dokumentstil (Diagnose → nummerierte TODOs → Verifikation):

- **`planned/`** — ausgearbeitete, aber noch nicht (vollständig) umgesetzte Pläne. Einstiegspunkt
  für eine neue Session, die an dem betroffenen Codeteil arbeitet: erst hier nachsehen, ob es
  bereits eine Diagnose gibt, statt neu zu analysieren.
- **`done/`** — abgeschlossene Pläne, jeweils mit einem `## Status (<Datum>)`-Abschnitt oben, der
  festhält, was tatsächlich umgesetzt wurde (inkl. bewusst nicht umgesetzter TODOs und warum).
  `done/review-2026-08/` ist das ursprüngliche datei-für-Datei-Code-Review, aus dem die meisten
  Pläne hervorgegangen sind (Einstieg: `done/review-2026-08/00-overview.md`).

## Wichtig: Pläne werden nicht rückwirkend als "erledigt" markiert

Ein Plan wandert von `planned/` nach `done/`, sobald seine TODOs abgearbeitet sind — er wird
**nicht** stillschweigend gelöscht oder umgeschrieben. Verlinkt eine `CLAUDE.md` (Root oder
verzeichnis-lokal) auf einen Plan unter `planned/`, kann dieser Plan zwischenzeitlich nach
`done/` verschoben worden sein, ohne dass der Link aktualisiert wurde — die Root-`CLAUDE.md`
wird nicht automatisch aktuell gehalten. Vor dem Weiterarbeiten an einem verlinkten Plan also
kurz prüfen, ob er noch unter `planned/` liegt oder schon nach `done/` verschoben wurde.

## Neuen Plan schreiben

Stil an einem bestehenden Dokument orientieren, z.B. `done/onpush-refactor-plan.md` oder
`planned/currentGame-state-split-plan.md`:

1. **Diagnose** — konkreter Befund mit `datei.ts:Zeile`-Belegen, nicht nur eine Behauptung.
2. **Nummerierte TODOs** — jeder Schritt einzeln umsetz- und verifizierbar (`ng build`,
   `ng test --watch=false --browsers=ChromeHeadlessCI`, ggf. `npm run test:rules`), nicht alles
   in einem Rutsch.
3. **Verifikation** — was am Ende geprüft wird, inkl. offen gebliebener Punkte (z.B. ein
   manueller Multiplayer-Smoke-Test, der ohne laufendes Firebase-Emulator-Setup nicht
   durchführbar war) statt sie zu verschweigen.
