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
  nächstes kommt, ~130 Zeilen).
- **`monster-collection.data.ts`** — die eigentlichen Monster-Datenliterale, bewusst aus der
  Klasse ausgelagert (gleiches Prinzip wie `hero-definitions.ts`: Daten getrennt von Logik).

## Sonstiges

- **`game.ts`** — Spiel-Datenstruktur, wie sie in Firestore unter `games/{gameId}` liegt
  (Felder decken sich mit dem, was die States unter `src/app/states/` verwalten — bei einer
  Feld-Änderung hier auch `firestore.rules`/`firestore.rules.test.js` und den betroffenen State
  mitziehen). Enthält u.a. `timerStartedAt`/`timerDurationSeconds` für den Dungeon-Timer —
  Gesamt-Feature in `src/app/components/game/CLAUDE.md` beschrieben.
- **`user.class.ts`** — Nutzer-Datenstruktur (`CurrentUserService`/`CurrentUserState`).
- **`shuffle.util.ts`** — reine Shuffle-Funktion, von `Hero.buildCardstack()` genutzt.

## Neuen Helden/Monster hinzufügen

Datengetrieben ergänzen (`hero-definitions.ts` bzw. `monster-collection.data.ts`), nicht durch
eine neue Klasse — der ganze Sinn des Refactorings war, Duplikate zwischen strukturell
identischen Helden (z.B. ehemals Barbar/Gladiator) zu vermeiden.
