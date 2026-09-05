# src/models/ — Domänen-Modell (kein Angular-Code)

Reine TypeScript-Klassen/Interfaces, kein DI, kein Firestore-Zugriff — Serialisierung dorthin
läuft über `ToJSONService` (`src/app/services/CLAUDE.md`).

## helden/ — datengetrieben (nicht mehr zehn Klassen)

`docs/done/hero-data-model-plan.md` ist umgesetzt: Es gibt **keine** zehn Heldenklassen mehr.

- **`hero-definitions.ts`** — `HeroId`-Union (`'barbar' | 'dieb' | ...`) + `HeroDefinition[]`
  (Name, Heropower, Beschreibung, `cardCounts: Map<string, number>` pro Held). Neuer Held oder
  geänderte Kartenverteilung: hier eintragen, keine neue Klasse anlegen. Seit 2026-09-05
  zusätzlich `activatesOn`/`resolutionKind` (welcher Encounter-Typ die Heldenfähigkeit
  freischaltet bzw. welches Auflösungs-Ereignis sie auslöst) — ersetzt zwei vormals duplizierte
  `switch`/Methoden-Sets in `HeropowerComponent`/`HeropowerContainerComponent`, siehe
  `components/heropower/CLAUDE.md`.
- **`hero.class.ts`** — eine `Hero`-Klasse für alle Helden. `buildCardstack(cardCounts)` mischt
  die Kartenverteilung einer `HeroDefinition` zu einem Stapel (`shuffle.util.ts`).
  `createHero(id: HeroId, useExtraDeck = false)` ist die Factory: sucht die `HeroDefinition` zur
  `id` und baut daraus eine `Hero`-Instanz. `useExtraDeck: true` mischt zusätzlich das Deck aus
  `EXTRA_DECK_FOR_HERO[id]` (`hero-definitions.ts`) ein — 2-Spieler-Sonderregel (Anleitung S. 3)
  bzw. Singleplayer-Erweiterung, aufgerufen von `DialogChooseHeroComponent` über die
  `useExtraDeck`-Dialog-Data, die `GameComponent.openDialog()` bei `numberOfPlayers === 1 || 2`
  setzt.
- **`card.class.ts`** — `Card`/`CardStack`-Interfaces (Token-Strings), keine Logik.

## monster/

- **`monster.class.ts`** (`Monster`) — Auswahl-/Schwierigkeitslogik (welcher Gegner als
  nächstes kommt). `createMob(numberOfPlayers, currentBossName, difficulty)` berechnet Monster-/
  Quest-Kartenzahl seit 2026-09-05 über eine geschlossene Formel statt der ursprünglichen
  5×3-Boss-/Schwierigkeits-Kaskade mit 11 positionellen Zahlen-Parametern (`getMonsterForGame()`,
  Architecture-Review-Kandidat 4 — alle 5×3×5 Boss-/Schwierigkeits-/Spielerzahl-Zellen wurden vor
  der Umstellung gegen die alten hartcodierten Werte verifiziert, `monster.class.spec.ts` deckt
  das weiterhin exakt gleich ab): `BOSS_ORDER` (`Baby-Barbar`/`Der Flecken-Schrecken`/`Zola, die
  Gorgone`/`Verdammt, ein Drache!!!`) liefert per `indexOf()` den Boss-Index, ein nicht gelisteter
  Name (aktuell nur `Der Dungeon-Overlord`) fällt auf den Index direkt danach zurück — genau wie
  vorher der `else`-Zweig jeden unbekannten Namen wie den schwersten Boss behandelte.
  `DIFFICULTY_INDEX` kennt nur `easy`/`medium` (0/1), alles andere (aktuell nur `hard`) fällt auf
  Index 2 zurück, ebenfalls unverändert zum vorherigen `if/else if/else`. Formel: `monsterCount =
  2×Spieler + 6 + 4×Boss-Index + 4×Schwierigkeits-Index`, `questCount = 2×Spieler` (Anzeige-
  Labels seit Issue #86 "Lehrling"/"Held"/"Dungeon-Master", siehe
  `dialog-game-settings.component.ts`). Die Multiplayer-Werte (2-5 Spieler) sind 1:1 aus der
  Originalanleitung übernommen (per Foto-Vergleich aller 5 Boss-Karten verifiziert, 2026-09-04);
  die Singleplayer-Spalte (`numberOfPlayers === 1`) hat **kein** Original-Vorbild (die Anleitung
  kennt keine 1-Spieler-Variante) und ist eine mit Patrick abgestimmte Fortschreibung derselben
  Formel auf einen Spieler — Details/Tabelle in Issue #86. Ursprünglich war `case 1:` in
  `getMonsterForGame()` fest auf 5 Monster + 1 Event codiert, unabhängig vom gewählten
  Schwierigkeitsgrad — ein Bug (Issue #86), kein bewusstes Feature;
  `docs/done/singleplayer-mode-plan.md` beschreibt das noch als ursprüngliche PR-1-Regel, hat
  aber inzwischen einen Nachtrag dazu.
  `loadMonster()`/`loadQuests()`/`loadSoloQuests()` deckeln die
  angeforderte Kartenzahl per `Math.min()` auf die tatsächlich verfügbare Anzahl in der
  jeweiligen Collection — ohne den Schutz pusht die Ziehschleife `undefined`-Einträge, sobald
  mehr Karten angefordert werden als vorhanden sind. `questCount` (`2×Spieler`) ist mit bis zu 10
  (5 Spieler) auf die volle spätere Kartenzahl ausgelegt; `questCollection`
  hat inzwischen 9 von 10 geplanten Kartentypen aktiv (nur "Hinterhalt" bleibt auskommentiert,
  siehe unten) — bei 5 Spielern (`questCount = 10`) greift der `Math.min()`-Schutz also weiterhin.
  Ein `undefined`-Mob-Eintrag führt beim `.shift()` in `GameFactoryService.buildNewGame()`/
  `CardPlayService.continueToNextDungeon()` zu einem TypeError, sobald er zufällig zuerst gezogen
  wird — `monster.class.spec.ts` hat einen Regressionstest über alle Boss-/Schwierigkeits-/
  Spielerzahl-Kombinationen dafür. `loadSoloQuests()` filtert nur noch `name !== 'Chaos'` heraus
  (seit Issue #90) — Mini-Bosse sind seither auch im Singleplayer Teil des Quest-Ziehpools,
  genau wie im Multiplayer; ausschließlich "Chaos" bleibt gefiltert, weil es eine
  Zielspieler-Weitergabe voraussetzt, die es im Solo-Modus nicht gibt.
- **`monster-collection.data.ts`** — die eigentlichen Monster-Datenliterale, bewusst aus der
  Klasse ausgelagert (gleiches Prinzip wie `hero-definitions.ts`: Daten getrennt von Logik).
  `questCollection` enthält alle 5 Mini-Bosse (`type: 'Mini-Boss'`) und 4 Ereigniskarten; nur
  "Hinterhalt" bleibt auskommentiert, weil sein Zwei-Karten-Reveal-Mechanismus
  (`docs/done/five-minute-dungeon-rules-plan.md` TODO 9) nicht umgesetzt ist — der
  Encounter-Loop kennt nur einen `currentEnemy` nach dem anderen. Mini-Bosse brauchen keinen
  Sonderschutz vor Heldenfähigkeiten in `heropower.component.ts`: deren `heroPower*()`-Methoden
  aktivieren die "Array"-Heropower (die den Gegner direkt besiegt) ohnehin nur bei
  `currentEnemy().type === 'Monster' | 'Person' | 'Hindernis'` — `'Mini-Boss'` fällt da naturgemäß
  durch.

## Sonstiges

- **`game.ts`** — Spiel-Datenstruktur, wie sie in Firestore unter `games/{gameId}` liegt
  (Felder decken sich mit dem, was die States unter `src/app/states/` verwalten — bei einer
  Feld-Änderung hier auch `firestore.rules`/`firestore.rules.test.js` und den betroffenen State
  mitziehen; `firestore.rules` ist hier bewusst ausgenommen, da sie feldunabhängig jedem
  signierten Nutzer Lese-/Schreibzugriff auf das gesamte `games/{gameId}`-Dokument erlaubt). Enthält
  u.a. `timerStartedAt`/`timerDurationSeconds` für den Dungeon-Timer — Gesamt-Feature in
  `src/app/components/game/CLAUDE.md` beschrieben. `allBosses` ist die Warteschlange der nach dem
  aktuellen Boss noch ausstehenden Bosse (nicht die volle 5-Boss-Liste — siehe `EncounterState` in
  `src/app/states/CLAUDE.md` und `CardPlayService.continueToNextDungeon()` in
  `src/app/services/CLAUDE.md`). `stats: GameStats` (`enemiesDefeated`/`cardsPlayed`/
  `cardsCycled`/`heropowersUsed`) ist die Kampagnen-Statistik — Zählstellen/Anzeige in
  `src/app/components/game/CLAUDE.md`.
- **`user.class.ts`** — Nutzer-Datenstruktur (`CurrentUserService`/`CurrentUserState`). Seit
  Issue #76 (PR 4 aus `docs/done/login-multiplayer-onboarding-plan.md`): `userEmail` ist
  optional (anonyme Multiplayer-Accounts, `signInAnonymously()`, haben keine E-Mail) —
  `toJSON()` lässt das Feld komplett weg statt `undefined` zu schreiben, da Firestore ein
  explizites `undefined`-Feld ablehnt. Neues Feld `lastActivityAt: Timestamp | FieldValue |
  null` (Typ-Import bewusst aus dem Firebase-Core-SDK `firebase/firestore`, nicht
  `@angular/fire`, damit dieses reine Datenmodell kein Angular-Detail referenziert) — Grundlage
  der künftigen 7-Tage-TTL-Policy auf anonyme Multiplayer-Accounts (PR 5, noch offen); wer es
  tatsächlich als `serverTimestamp()` schreibt, ist `GameRepositoryService`/
  `PlayerRepositoryService` (`services/CLAUDE.md`), nicht diese Klasse selbst.
- **`shuffle.util.ts`** — reine Shuffle-Funktion, von `Hero.buildCardstack()` genutzt.

## Neuen Helden/Monster hinzufügen

Datengetrieben ergänzen (`hero-definitions.ts` bzw. `monster-collection.data.ts`), nicht durch
eine neue Klasse — der ganze Sinn des Refactorings war, Duplikate zwischen strukturell
identischen Helden (z.B. ehemals Barbar/Gladiator) zu vermeiden.
