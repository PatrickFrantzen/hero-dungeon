# Plan: Reiner Singleplayer-Modus

## Status (2026-08-29)

Repo lokal geladen auf Branch `feature/singleplayer-mode`. `npm ci --legacy-peer-deps` und
`npm run build` wurden erfolgreich ausgeführt. Die erste Singleplayer-Implementierung ist umgesetzt:
Singleplayer-Einstieg, Solo-Heldenfilter (`Dieb`, `Waldläufer`), 5 normale Monster + 1 Event,
Deck-Cycling über Ablagestapel, Rasten-Aktion, Solo-Event-Auflösung und Siegzustand nach
besiegtem `Baby-Barbar`.

Verifikation: `npm run build` grün und `npx tsc -p tsconfig.spec.json --noEmit` grün. Karma-Tests
kompilieren, können in dieser Umgebung aber nicht starten, weil kein Chrome/Chromium-Binary für
`ChromeHeadlessCI` installiert ist. Firestore-Rules-Tests können in dieser Umgebung nicht starten,
weil Java fehlt.

**Nachtrag (2026-09-04):** Die weiter unten offene "Produktentscheidung" (Variante A vs. B) ist
mit `docs/planned/login-multiplayer-onboarding-plan.md` entschieden — **Variante B (echter
Offline/Local-Singleplayer)** ist die beschlossene Richtung. Der Persistenz-/Login-Umbau dafür
(lokaler Spielstand, mehrere parallele Saves, Account-Angebot beim Spielende) steht in PR 1-3
dieses neuen Plans; die hier noch offenen PR 1/1b/2/3-TODOs (Deck-Cycling/Deadlock-Schutz,
Singleplayer-Helden-Filter, Siegzustand) bleiben unverändert gültig und unabhängig davon zu
erledigen — beide Pläne ergänzen sich (Spielregeln hier, Persistenz/Auth dort).

## Aktueller Ist-Ablauf im Code

### 1. Spiel erstellen

- Einstieg: `StartscreenComponent.newGame()` → `openDialog()`.
- Dialog: `DialogGameSettingsComponent` fragt aktuell `numberOfPlayer`, `difficulty`, `gameId` ab.
- Validierung: UI-Placeholder sagt „1 bis 5“, Validator erlaubt aber nur `2..5`.
- Erstellung: `GameFactoryService.buildNewGame(numberOfPlayer, difficulty, gameId)` erzeugt einen
  `Game`-Datensatz.
- Boss: der Startboss ist fest `Baby-Barbar`.
- Dungeon-/Mob-Stapel: `new Monster().createMob(numberOfPlayer, 'Baby-Barbar', difficulty)` erzeugt
  den Stapel normaler Gegner/Events für die gewählte Spielerzahl und Schwierigkeit.
- Persistenz: das Spiel wird als Firestore-Dokument `games/{gameId}` gespeichert.

### 2. Spiel betreten und Held wählen

- Route: nach Erstellung/Join geht es zu `/game/{gameId}`.
- `GameComponent.ngOnInit()` prüft, ob der aktuelle Firebase-User schon in `choosenHeros` steht.
- Falls nein:
  - `games/{gameId}/player/{playerId}` wird angelegt.
  - `DialogChooseHeroComponent` öffnet die Heldenauswahl.
  - Nach Auswahl werden Held, Kartenstapel und initiale 5 Handkarten ins Player-Dokument geschrieben.
  - Der Spieler wird in `games/{gameId}.choosenHeros` eingetragen.

### 3. Kampf gegen normale Gegner/Events

- Anzeige: `EnemyContainerComponent` liest den aktuellen Encounter aus NGXS/Firestore und zeigt
  `EnemyComponent`.
- Karten: `PlayerHandComponent` zeigt die Handkarten und delegiert Klicks an `CardPlayService`.
- Regelkern: `CardPlayService.chooseCard()` prüft, ob die Karte zum aktuellen Gegner-Token passt.
- Treffer:
  - Token wird aus `currentEnemy.token` entfernt.
  - Karte wird aus der Hand entfernt.
  - Hand wird bis maximal 5 aus dem eigenen Kartenstapel nachgezogen.
  - Änderungen werden nach Firestore geschrieben.
- Wenn `currentEnemy.token` leer ist:
  - solange `Mob` noch Einträge hat: nächster normaler Gegner/Event wird gezogen.
  - wenn `Mob` leer ist: `currentBoss` wird als nächster Encounter gesetzt.

### 4. Boss `Baby-Barbar`

- `GameFactoryService` setzt `currentBoss` fest auf `Baby-Barbar`.
- Wenn alle normalen Mobs besiegt/abgearbeitet sind, ruft `CardPlayService.getNextBoss()` genau
  diesen Boss als `currentEnemy` ab.
- Einen expliziten Siegzustand nach besiegtem Boss gibt es aktuell noch nicht; im Code existiert
  nur `isLost`, aber kein `isWon`/`gameStatus`.

## Zielbild Singleplayer

„Reiner Singleplayer“ sollte fachlich heißen:

1. **Solo-Spiel erstellen** ohne Lobby-/Join-Zwang und ohne weitere menschliche Spieler.
2. **Genau ein Held** wird gewählt; der komplette Loop läuft über diese eine Hand.
3. **Heldenauswahl für Solo zuschneiden**: `Dieb` und `Waldläufer` sind die besten Singleplayer-
   Helden. `Magier` und `Walküre` sind im Solo-Spiel nicht passend bzw. nicht empfehlenswert,
   weil ihre Fähigkeiten stark vom Multiplayer-Kontext abhängen.
4. **Dungeon-Loop**: 5 normale Monster und 1 Event nacheinander bekämpfen/abhandeln.
5. **Deck-Cycling/Deadlock-Schutz**: der Solo-Modus muss sicherstellen, dass der Spieler weiter
   durch sein Deck kommt, auch wenn die aktuelle Hand keine passende Karte enthält.
6. **Finale**: nach leerem Mob-Stapel erscheint `Baby-Barbar` als Boss.
7. **Ende**: nach besiegtem Boss gibt es einen sichtbaren Siegzustand.

Offene Produktentscheidung: „rein“ kann technisch zwei Bedeutungen haben:

- **Variante A — Solo über bestehendes Firebase-Spielmodell:** schnellster Weg; `numberOfPlayers=1`
  erlauben, aber Auth/Firestore bleiben aktiv. Gut für kleine PR.
- **Variante B — echter Offline/Local-Singleplayer:** kein Join, keine Firebase-Spielpersistenz im
  Kampfloop, lokaler State/LocalStorage. Sauberer für „reinen“ Singleplayer, aber deutlich größerer
  Umbau, weil `GameComponent`, `PlayerHandComponent`, `CardPlayService` und Repositories aktuell auf
  Firestore ausgerichtet sind.

## Empfohlener Schnitt

### PR 1 — Solo-Spiel im bestehenden Modell erlauben

- `DialogGameSettingsComponent` erlaubt `1..5` statt `2..5`.
- `Monster.createMob()` bekommt explizite Regeln für `numberOfPlayers === 1`:
  - 5 normale Monster
  - 1 Event
  - danach Boss `Baby-Barbar`
- `GameFactoryService`-Tests prüfen `numberOfPlayers=1`, Startboss `Baby-Barbar`, normaler
  Mob-Stapel enthält genau 6 Encounters vor dem Boss und davon genau 1 Event.
- Ziel: Der bestehende Spielloop kann mit nur einem Spieler starten.

### PR 1b — Deck-Cycling/Deadlock-Schutz für Solo

- Aktuelles Risiko: Wenn der Spieler keine passende Handkarte hat und der Kartenstapel leer oder
  ungünstig sortiert ist, kann ein Solo-Spiel dead-locken.
- Fachliche Regel noch final festlegen. Kandidaten:
  1. Wenn der Nachziehstapel leer ist, wird der Ablagestapel gemischt und neuer Nachziehstapel.
  2. Spieler darf pro Zug/bei Bedarf Karten abwerfen, um neue Karten zu ziehen.
  3. Wenn keine Handkarte passt, darf der Spieler automatisch eine Karte abwerfen und nachziehen.
- Dafür muss der Ablagestapel (`deliveryStack`) im Kartenspiel-Loop wirklich befüllt und beim
  Nachziehen berücksichtigt werden.

### PR 2 — Singleplayer als eigener Einstieg

- Startscreen bekommt eine sichtbare Aktion „Singleplayer starten“.
- Für Singleplayer wird eine Game-ID automatisch erzeugt; kein Join-Code nötig.
- Direkt danach: Heldenauswahl → initiale Hand → Kampf.
- `choosenHeros` bleibt intern kompatibel, enthält aber genau einen Spieler.
- Heldenauswahl im Singleplayer hervorheben/filtern:
  - empfohlen: `Dieb`, `Waldläufer`
  - nicht empfohlen oder ausgeblendet: `Magier`, `Walküre`
  - offene UI-Entscheidung: alle Helden weiter auswählbar lassen, aber Solo-Empfehlungen anzeigen;
    oder Singleplayer bewusst auf die geeigneten Solo-Helden begrenzen.

### PR 3 — Siegzustand nach `Baby-Barbar`

- Domain erweitern: `gameStatus: 'playing' | 'won' | 'lost'` statt nur `isLost` oder zusätzlich dazu.
- Wenn `currentEnemy` der Boss ist und dessen Token leer werden: Status `won` setzen, statt erneut
  Boss/leerem Stapel zu laden.
- UI zeigt Siegmeldung und optional „Neues Singleplayer-Spiel“.
- Firestore Rules/Tests prüfen das neue Feld, falls Firestore weiter beteiligt bleibt.

### PR 4 — Optional: echter Offline-Singleplayer

- Einen separaten `SingleplayerGameState`/Service einführen, der den Loop ohne Firestore ausführt.
- `CardPlayService` entkoppeln: Regeln als reine Funktionen oder Adapter (`GameSessionPort`) statt
  direkte Repository-Writes.
- UI kann denselben Karten-/Enemy-View wiederverwenden, aber Daten kommen lokal statt aus Firestore.

## Verifikation

Nach jedem PR-Schritt:

- `npm run build`
- `ng test --watch=false --browsers=ChromeHeadlessCI`
- Manueller Smoke-Test:
  1. Singleplayer starten.
  2. Held auswählen.
  3. Erste 5 Handkarten erscheinen.
  4. Passende Karte reduziert Gegner-Token.
  5. Nach leerem Gegner erscheint der nächste normale Gegner/Event.
  6. Nach leerem Mob-Stapel erscheint `Baby-Barbar`.
  7. Nach besiegtem `Baby-Barbar` erscheint ein Siegzustand.
