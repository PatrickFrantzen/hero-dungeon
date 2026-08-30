# src/models/ — Domänen-Modell (kein Angular-Code)

Reine TypeScript-Klassen/Interfaces, kein DI, kein Firestore-Zugriff — Serialisierung dorthin
läuft über `ToJSONService` (`src/app/services/CLAUDE.md`).

## helden/ — datengetrieben (nicht mehr zehn Klassen)

`docs/done/hero-data-model-plan.md` ist umgesetzt: Es gibt **keine** zehn Heldenklassen mehr.

- **`hero-definitions.ts`** — `HeroId`-Union (`'barbar' | 'dieb' | ...`) + `HeroDefinition[]`
  (Name, Heropower, Beschreibung, `cardCounts: Map<string, number>` pro Held). Neuer Held oder
  geänderte Kartenverteilung: hier eintragen, keine neue Klasse anlegen.
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
  nächstes kommt, ~130 Zeilen). `loadMonster()`/`loadQuests()`/`loadSoloQuests()` deckeln die
  angeforderte Kartenzahl per `Math.min()` auf die tatsächlich verfügbare Anzahl in der
  jeweiligen Collection — ohne den Schutz pusht die Ziehschleife `undefined`-Einträge, sobald
  mehr Karten angefordert werden als vorhanden sind. `questTwo`/`-Drei`/`-Vier`/`-Fünf` in
  `createMob()` sind mit 4/6/8/10 auf die volle spätere Kartenzahl ausgelegt; `questCollection`
  hat inzwischen 9 von 10 geplanten Kartentypen aktiv (nur "Hinterhalt" bleibt auskommentiert,
  siehe unten) — bei 5 Spielern (`questFive: 10`) greift der `Math.min()`-Schutz also weiterhin.
  Ein `undefined`-Mob-Eintrag führt beim `.shift()` in `GameFactoryService.buildNewGame()`/
  `CardPlayService.continueToNextDungeon()` zu einem TypeError, sobald er zufällig zuerst gezogen
  wird — `monster.class.spec.ts` hat einen Regressionstest über alle Boss-/Schwierigkeits-/
  Spielerzahl-Kombinationen dafür. `loadSoloQuests()` filtert zusätzlich `type !== 'Mini-Boss'`
  heraus (neben `name !== 'Chaos'`) — der Singleplayer-Modus zieht laut
  `docs/planned/singleplayer-mode-plan.md` nur normale Event-Karten, keine Mini-Bosse.
- **`monster-collection.data.ts`** — die eigentlichen Monster-Datenliterale, bewusst aus der
  Klasse ausgelagert (gleiches Prinzip wie `hero-definitions.ts`: Daten getrennt von Logik).
  `questCollection` enthält alle 5 Mini-Bosse (`type: 'Mini-Boss'`) und 4 Ereigniskarten; nur
  "Hinterhalt" bleibt auskommentiert, weil sein Zwei-Karten-Reveal-Mechanismus
  (`docs/planned/five-minute-dungeon-rules-plan.md` TODO 9) nicht umgesetzt ist — der
  Encounter-Loop kennt nur einen `currentEnemy` nach dem anderen. Mini-Bosse brauchen keinen
  Sonderschutz vor Heldenfähigkeiten in `heropower.component.ts`: deren `heroPower*()`-Methoden
  aktivieren die "Array"-Heropower (die den Gegner direkt besiegt) ohnehin nur bei
  `currentEnemy().type === 'Monster' | 'Person' | 'Hindernis'` — `'Mini-Boss'` fällt da naturgemäß
  durch.

## Sonstiges

- **`game.ts`** — Spiel-Datenstruktur, wie sie in Firestore unter `games/{gameId}` liegt
  (Felder decken sich mit dem, was die States unter `src/app/states/` verwalten — bei einer
  Feld-Änderung hier auch `firestore.rules`/`firestore.rules.test.js` und den betroffenen State
  mitziehen). Enthält u.a. `timerStartedAt`/`timerDurationSeconds` für den Dungeon-Timer —
  Gesamt-Feature in `src/app/components/game/CLAUDE.md` beschrieben. `allBosses` ist die
  Warteschlange der nach dem aktuellen Boss noch ausstehenden Bosse (nicht die volle 5-Boss-Liste
  — siehe `EncounterState` in `src/app/states/CLAUDE.md` und `CardPlayService.continueToNextDungeon()`
  in `src/app/services/CLAUDE.md`).
- **`user.class.ts`** — Nutzer-Datenstruktur (`CurrentUserService`/`CurrentUserState`).
- **`shuffle.util.ts`** — reine Shuffle-Funktion, von `Hero.buildCardstack()` genutzt.

## Neuen Helden/Monster hinzufügen

Datengetrieben ergänzen (`hero-definitions.ts` bzw. `monster-collection.data.ts`), nicht durch
eine neue Klasse — der ganze Sinn des Refactorings war, Duplikate zwischen strukturell
identischen Helden (z.B. ehemals Barbar/Gladiator) zu vermeiden.
