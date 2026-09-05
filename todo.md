<!--
  Diese Datei sammelt Findings aus einer Portfolio-/Code-Review (2026-09-05, Recruiter-Perspektive).
  Kein aktiver Umsetzungsplan im Sinne von docs/CLAUDE.md — dient als Backlog-Übersicht.
  Details/Kontext zu card-play.service.ts: docs/CLAUDE.md-Konvention beachten, falls daraus
  ein eigener Plan unter docs/planned/ entsteht.
-->

# TODO — Findings aus Portfolio-Review (2026-09-05)

## Priorität 1: `card-play.service.ts` refactorn (859 Zeilen, größte Datei im Repo)

**Befund:** God-Service mit ~40 privaten Hilfsmethoden für die Kartenregeln. Auswahl der
Karten-Logik läuft über lange `if (card === 'x')`-Ketten statt über ein Strategy-Pattern
oder eine Lookup-Table. Für einen Reviewer/Interviewer ist das die auffälligste Schwachstelle
im Code.

Vorschlag zur Aufteilung (vor Umsetzung mit Patrick abstimmen, betrifft Kernregeln):

- [ ] Kartenwirkungen in einzelne Strategie-Klassen/Funktionen auslagern, eine pro Kartentyp
      (z.B. `spende.strategy.ts`, `stehlen.strategy.ts`, `rest.strategy.ts`), mit gemeinsamem
      Interface (`CardEffect { apply(context): GameStateDelta }` o.ä.)
- [ ] Card-Typ → Strategie-Zuordnung über eine Lookup-Map statt `if`/`switch`-Ketten auflösen
- [ ] Die drei separaten `bumpStat`-Implementierungen (`card-play.service.ts`,
      `heropower.service.ts`, `dieb.service.ts`) konsolidieren, sofern sich die Duplikation
      beim Refactoring nicht sachlich weiter rechtfertigt — aktuell laut CLAUDE.md bewusst
      getrennt gehalten, das sollte im Zuge der Aufteilung neu bewertet werden
      (Ursprungsentscheidung dokumentieren, warum getrennt oder warum zusammengeführt)
- [ ] Bestehende Tests aus `card-play.service.spec.ts` (15 Fälle inkl. Bug-/TODO-Referenzen)
      unverändert grün halten — Refactoring ist reine Struktur-, keine Verhaltensänderung
- [ ] Nach Aufteilung: `src/app/services/CLAUDE.md` aktualisieren (neue Dateien/Struktur
      eintragen, God-Service-Hinweis entfernen)
- [ ] In kleinen Schritten vorgehen (siehe Root-CLAUDE.md, Referenz
      `docs/done/onpush-refactor-plan.md`): nach jedem Schritt `ng build` +
      `ng test --watch=false --browsers=ChromeHeadlessCI` grün halten

## Priorität 2: Standard-Inkonsistenzen beheben

- [ ] `inject()` statt Constructor-DI konsequent durchziehen — betroffen u.a.
      `player-hand.component.ts` und `game.component.ts`, die trotz Root-CLAUDE.md-Vorgabe
      (Issue #94) noch Constructor-DI nutzen
- [ ] Firestore-Direktzugriffe aus `game.component.ts` (`checkIfPlayerIsAlreadyPartOfGame`,
      `drawInitialHand`) in einen Service auslagern, statt sie direkt in der Komponente zu
      halten (passend zur bereits etablierten Repository-/Business-Logik-Trennung)

## Priorität 3: Dokumentation für externe Betrachter (Recruiter/neue Teammitglieder)

- [x] README.md von Angular-CLI-Boilerplate auf echtes Projekt-README umgestellt
      (Beschreibung, Live-Demo-Link, Tech-Stack, Architektur-Highlights, Setup) — 2026-09-05
- [ ] Screenshot(s)/GIF vom Spielbrett und von der Handkarten-Ansicht ins README einfügen
      (Platzhalter-Kommentar ist gesetzt)
- [ ] Prüfen, ob die 12 verstreuten `CLAUDE.md`-Dateien + 23 Pläne unter `docs/` für externe
      Betrachter (nicht nur KI-Agenten) eine kurze, lesbare Zusammenfassung brauchen — z.B.
      einen kurzen "Architecture Decisions"-Abschnitt im README, der auf die Doku verweist,
      damit der Umfang nicht wie unstrukturierter Overhead wirkt

## Nicht als Bug, aber bewusst offen halten

- Deutsch/Englisch-Mischsprache (Feldnamen englisch, Kommentare/Kartennamen deutsch) —
  laut Root-CLAUDE.md bewusst nicht vereinheitlichen, wenn nicht explizit beauftragt
