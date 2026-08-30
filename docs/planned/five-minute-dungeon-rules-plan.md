# Regel-Plan: hero-dungeon an die "5 Minute Dungeon"-Originalanleitung angleichen

## Status (2026-08-30)

Diagnose basiert auf einem vollständigen Abgleich der deutschen Originalanleitung
(„5-Minute Dungeon – Regeln“, Wiggles 3D / KOSMOS) mit dem aktuellen Code-Stand.

Umgesetzt: TODO 1 (Kartenanzahl Paladin/Walküre), TODO 2 (Starthand-/Nachziehgröße je
Spielerzahl), TODO 5+6 (Timer-Pause-Infrastruktur, Magier "Zeit einfrieren", Walküre/Paladin
"Göttlicher Schild"), und TODO 7 vollständig: Paladin/Walküre "Heilige Handgranate" und
"Heiltrank" (Sonderfälle direkt in `CardPlayService.chooseCard()`, analog zu
`resolveGoettlicherSchild()`), sowie die fünf Aktionskarten mit Zielspieler-Auswahl —
Dieb/Ninja "Spende"/"Stehlen", Jägerin/Waldläufer "Heilkräuter", Barbar/Gladiator "Wut"
(zwei Zielspieler), Paladin/Walküre "Heilung" (Karte `heile`). Letztere fünf laufen **nicht**
über `chooseCard()`, sondern über eigene `CardPlayService.resolve*()`-Methoden, die
`PlayerHandComponent.chooseCard()` direkt aufruft, nachdem dort der wiederverwendete
`DialogHeropowerComponent`-Zielspieler-Dialog geschlossen wurde (bei "Wut" zweimal
nacheinander) — Details in `src/app/components/player-hand/CLAUDE.md` und
`src/app/services/CLAUDE.md`.

TODO 7 ist damit vollständig abgeschlossen.

TODO 3 umgesetzt: `Hero.createHero(id, useExtraDeck)` mischt bei `useExtraDeck=true` das Deck aus
`EXTRA_DECK_FOR_HERO[id]` (`hero-definitions.ts`) ein — 80 statt 40 Karten. Bewusst über die
2-Spieler-Regel aus der Anleitung hinaus erweitert: `GameComponent.openDialog()` setzt
`useExtraDeck` sowohl bei `numberOfPlayers === 2` (Originalregel) als auch bei
`numberOfPlayers === 1` (Singleplayer, keine Originalregel — Absprache mit Nutzer, da der
Singleplayer-Modus ohnehin schon eine Erweiterung ist und mit nur 40 Karten schneller
"leerläuft" als im 2-Spieler-Fall). Da die Anleitung nur zwei konkrete Kombinationen empfiehlt
(Jägerin+gelb, Magier+lila), wurde eine feste Rotation über alle 5 Farben ergänzt
(rot→grün→gelb→blau→lila→rot), die diese beiden Empfehlungen enthält.

TODO 4 umgesetzt: `allBosses` (`EncounterState`/`Game`-Dokument) ist jetzt die Warteschlange der
nach dem aktuellen Boss noch ausstehenden Bosse (analog zu `Mob` für Dungeon-Karten), nicht mehr
die volle unbenutzte 5-Boss-Liste. `CardPlayService.prepareNextDungeon()` (aufgerufen aus
`checkForNextEnemy()`, sobald der aktuelle Boss besiegt ist) zieht den nächsten Boss aus dieser
Warteschlange, baut per `new Monster().createMob(...)` einen neuen Dungeon-Kartenstapel passend
zu Spielerzahl/Schwierigkeit und setzt den Timer per neuer `ResetGameTimer`-Action zurück; erst
wenn die Warteschlange nach Boss #5 (Dungeon-Overlord) leer ist, wird `gameStatus: 'won'`
gesetzt. `PlayerHandComponent.updateFromDatabase()` synct `currentBoss`/`allBosses` sowie einen
zurückgesetzten Timer bei jedem Firestore-Snapshot, damit der Boss-Wechsel bei allen Mitspielern
ankommt (vorher wurden beide Felder nach der initialen Spielerstellung nie wieder synchronisiert).

**Nebenbei gefundener und behobener Bug** (aufgefallen als scheinbar flakiger Test beim
Implementieren von TODO 4, tatsächlich aber reproduzierbar): `Monster.loadQuests()`/
`loadSoloQuests()` forderten ab 3 Spielern mehr Quest-Karten an, als die aktuell nur 4 aktiven
Kartentypen hergeben (Mini-Bosse sind auskommentiert, siehe TODO 9), und pushten dabei
`undefined`-Einträge ins Mob-Array — führte bei zufälliger Zieh-Reihenfolge zu einem TypeError
beim `.shift()` in `GameFactoryService.buildNewGame()`/`prepareNextDungeon()`, also praktisch zu
gelegentlichen Abstürzen bei jeder Spielerstellung mit 3+ Spielern. Mit `Math.min()` auf die
verfügbare Kartenanzahl gedeckelt, Regressionstest in `monster.class.spec.ts` über alle
Boss-/Schwierigkeits-/Spielerzahl-Kombinationen ergänzt. Der Bug verschwindet vollständig, sobald
TODO 9 die restlichen Quest-Kartentypen reaktiviert.

Wichtiger Hinweis vorab: Der im Repo bereits existierende **Singleplayer-Modus**
(`docs/planned/singleplayer-mode-plan.md`) ist eine bewusste Erweiterung des Originalspiels, das
laut Anleitung offiziell **keinen** Einzelspieler-Modus vorsieht. Dieser Plan behandelt ihn daher
nicht als Regelfehler und tastet ihn nicht an — die TODOs unten betreffen ausschließlich den
Mehrspieler-Regelkern, der von der Anleitung abweicht.

## Diagnose

Abgleich Anleitung ↔ Code, gegliedert nach Regelaspekt. Alle Befunde stammen aus einer
Code-Recherche vom 2026-08-30.

### 1. Start-Hand-Größe hängt nicht von der Spielerzahl ab

Anleitung: 2 Spieler → 5 Karten, 3 Spieler → 4 Karten, 4-5 Spieler → 3 Karten (S. 2, Tabelle).
Code: `GameComponent.drawInitialHand()` zieht immer fix 5 Karten
(`src/app/components/game/game.component.ts:171-178`, `cardStack.splice(0, 5)`), und
`CardPlayService.checkHandsize()` füllt bei jedem Nachziehen immer auf 5 auf
(`src/app/services/card-play.service.ts:196-213`, `Math.max(0, 5 - handsize.length)`). Beide
Stellen sind hartkodiert statt an `numberOfPlayers` gekoppelt.

### 2. 2-Spieler-Sonderregel (zweites Heldendeck einmischen) fehlt komplett

Anleitung: Bei genau 2 Spielern mischt jeder ein zusätzliches Heldendeck in sein eigenes
(80 Karten Nachziehstapel je Spieler), empfohlen Jägerin+gelb bzw. Magier+lila (S. 3).
Code: `Hero.buildCardstack()` mischt ausschließlich die `cardCounts` eines einzelnen Helden
(`src/models/helden/hero.class.ts:18-26`); kein Codepfad für `numberOfPlayers === 2`.

### 3. Nur Boss #1 erreichbar — keine Kampagne über 5 Bosse

Anleitung: Nach Sieg über einen Boss wird der nächste Dungeon (Boss #2 … #5) vorbereitet, erst
nach Boss #5 (Dungeon-Overlord) ist das Spiel gewonnen (S. 6).
Code: `GameFactoryService.buildNewGame()` übergibt an `Monster.createMob()` fest `'Baby-Barbar'`
(`src/app/services/game-factory.service.ts:14,26-30`). `allBosses` wird zwar im `Game`-Datensatz
mitgeführt (`src/models/game.ts:19`, `src/app/states/encounter-state.ts:12`), aber nirgends
durchlaufen: Sobald das Boss-Token leer ist, wird der Spielstatus direkt auf `'won'` gesetzt
(`src/app/services/card-play.service.ts:220-222`) statt den nächsten Boss vorzubereiten. Alle 5
Boss-Datensätze existieren (`src/models/monster/monster-collection.data.ts:56-130`), sind aber
toter Code.

### 4. Timer lässt sich nicht pausieren (Magier/Walküre-Fähigkeiten wirkungslos)

Anleitung: Magier „Zeit einfrieren" und Walküre „Göttlicher Schild" pausieren den Timer (S. 8/9)
— die einzigen beiden Wege im Spiel, den Timer anzuhalten.
Code: Kein Pause-/Freeze-Feld im `Game`-Modell, kein Reducer dafür. Magiers Fähigkeit ist eine
leere Stub-Methode (`src/app/components/heropower/heropower.component.ts:64-66`,
`heroPowerMagier() { }`) mit leerem `switch`-Zweig
(`src/app/components/heropower/heropower-container.component.ts:66-67`, `case 'Magier': break;`).
„Göttlicher Schild" existiert nur als Kartenname im Deck
(`src/models/helden/hero-definitions.ts:69`), ohne jede Spiellogik.

### 5. 7 von 10 Heldenfähigkeiten fehlen oder sind wirkungslos

Anleitung (S. 8-9) listet 10 fähigkeitsgebende Effekte. Implementiert sind:
- Dieb „5 neue Karten ziehen" (`src/app/services/dieb.service.ts:18-44`)
- Barbar/Gladiator/Zauberin/Waldläufer/Ninja/Paladin „Bedrohung direkt besiegen"
  (`src/app/services/heropower.service.ts:206-240`, `resolveArrayHeropower`)
- Jägerin „Tierliebe" (`heropower.service.ts:113-204` + `dialog-heropower.component.ts`)
- Walküre „Nachziehstapel auffüllen" (`heropower.service.ts:52-111`)

Fehlend/wirkungslos: Magier „Zeit einfrieren" (Punkt 4), Dieb „Spende"/„Stehlen", Jägerin/
Waldläufer „Heilkräuter", Barbar/Gladiator „Wut", Paladin/Walküre „Heilige Handgranate",
„Göttlicher Schild", „Heilung", „Heiltrank" — diese Karten existieren nur als Namen in
`cardCounts` bzw. als Icon-Assets (`heropower.component.html:16,19,25`), ohne dass ihr Ausspielen
gesondert behandelt wird.

### 6. Joker- und Bombenkarten sind unspielbar

Anleitung: Joker-Karten (Jägerin/Waldläufer) zählen als beliebiges Symbol, Magische Bomben
(Magier/Zauberin) als alle 5 Symbole gleichzeitig (S. 8).
Code: `PlayerHandComponent`/`CardPlayService.chooseCard()` prüft nur, ob
`currentEnemy().token` den exakten Karten-String enthält
(`src/app/services/card-play.service.ts:98-101`). Dungeon-Tokens enthalten nie die Strings
`'joker'` oder `'magischeBombe'`, obwohl beide Karten in den Decks vorkommen
(`hero-definitions.ts:56,84`) und als Bild existieren
(`src/assets/img/cards/joker.png`, `magischeBombe.png`). Die Karten lassen sich also nie sinnvoll
gegen eine Dungeon-Karte ausspielen.

### 7. Kein Event-Handling im Mehrspieler-Modus; nur 4 von 9 Event-Karten aktiv

Anleitung: Ereigniskarten müssen sofort ausgeführt werden, nur die Magier-Karte „Verhinderung"
kann sie stoppen (S. 8-9, Abschnitt „Quest-Karten").
Code: `CardPlayService.resolveSoloEvent()` behandelt Events nur, wenn
`isSoloEventActive()` greift, was auf `currentNumberOfPlayers() === 1` geprüft wird
(`src/app/components/player-hand/player-hand.component.ts:168-170`) — **im Mehrspieler-Modus gibt
es also gar keinen "Event ausführen"-Pfad**. Stattdessen wird jedes Event automatisch aufgelöst,
sobald irgendeine beliebige Doppelkarte gespielt wird
(`src/app/services/card-play.service.ts:70-81`, `isEventCard` prüft nur
`currMob.token[0].includes('event')`, unabhängig vom konkreten Karteninhalt) — das ist
regelwidrig, da laut Anleitung nur „Verhinderung" ein Event stoppen darf. Zudem sind von den
Original-Events nur „Plötzliche Krankheit", „Chaos", „Ein Wehweh", „Falltür" aktiv
(`src/models/monster/monster-collection.data.ts:19-43`); weitere Mini-Boss-Quest-Karten
(Feindselige Riesenkrabbe, Bonsai-T-Rex, Der Sammler, Der Rattenkönig, Zauberer mit schlechtem
Ruf, Hinterhalt) sind im Datenmodell auskommentiert (`monster-collection.data.ts:4-18,34-38,44-53`).

### 8. Mini-Bosse nicht vor Heldenfähigkeiten geschützt

Anleitung: Mini-Bosse (Quest-Karten) zählen weder als Monster, Hindernis noch Person und können
deshalb nicht durch Heldenfähigkeiten besiegt werden (S. 9).
Code: Da Mini-Boss-Quest-Karten aktuell auskommentiert sind (Punkt 7), ist diese Regel derzeit
gegenstandslos — muss aber mitgeliefert werden, sobald Mini-Bosse reaktiviert werden (siehe
TODO 7), sonst kann `resolveArrayHeropower()` (`heropower.service.ts:206-240`) sie fälschlich
direkt besiegen.

### 9. Verlustbedingungen unvollständig

Anleitung nennt drei Verlustwege (S. 7): Zeit läuft ab, kein Spieler hat mehr Handkarten, Gruppe
kann die geforderten Symbole nicht aufbringen.
Code: Nur „Zeit läuft ab" ist umgesetzt (`src/app/components/game/game.component.ts:90-105`,
setzt `gameStatus: 'lost'`). „Keine Handkarten mehr bei niemandem" und „Bedrohung nicht
überwindbar" existieren nicht als Prüfung.

### 10. Karten-Anzahl pro Heldendeck uneinheitlich (41 statt 40 bei Paladin/Walküre)

Anleitung: jedes Heldendeck hat exakt 40 Karten (S. 3).
Code: Barbar/Gladiator, Dieb/Ninja, Jägerin/Waldläufer, Magier/Zauberin summieren korrekt auf 40;
Paladin/Walküre summiert auf 41 (`src/models/helden/hero-definitions.ts:61-73`).

## TODOs

Reihenfolge nach Abhängigkeit und Risiko — kleine, einzeln verifizierbare Schritte, nach jedem
Schritt `ng build` und `ng test --watch=false --browsers=ChromeHeadlessCI` grün halten. Keine
Firestore-Strukturänderung ohne Anpassung von `firestore.rules`/`firestore.rules.test.js`
(betrifft v.a. TODO 3 und TODO 4, falls neue `Game`-Felder hinzukommen).

- [ ] **TODO 1 — Karten-Anzahl Paladin/Walküre auf 40 korrigieren**
  - `src/models/helden/hero-definitions.ts:61-73`: `cardCounts`-Summe von 41 auf 40 reduzieren
    (welche Karte reduziert wird, anhand der Originalanleitung/Kartenliste prüfen, falls
    verfügbar; sonst konservativ die naheliegendste Dopplung um 1 kürzen).
  - Verifikation: Summe aller `cardCounts`-Werte für Paladin/Walküre per Test oder kurzem Skript
    auf 40 prüfen, `ng test`.

- [ ] **TODO 2 — Start-Hand- und Nachzieh-Zielgröße an Spielerzahl koppeln**
  - Zentrale Funktion `startHandSize(numberOfPlayers: number): number` ergänzen (z.B. in
    `src/models/` oder als Service-Methode), Mapping 2→5, 3→4, 4-5→3 gemäß Tabelle S. 2.
  - `GameComponent.drawInitialHand()` (`game.component.ts:171-178`) auf diese Funktion umstellen
    statt `splice(0, 5)`.
  - `CardPlayService.checkHandsize()` (`card-play.service.ts:196-213`) ebenso: `5` durch
    `startHandSize(numberOfPlayers)` ersetzen.
  - Verifikation: `ng build`, `ng test`; manueller Test mit 2- und 4-Spieler-Lobby (Starthand-
    Größe in der UI zählen).

- [x] **TODO 3 — 2-Spieler-Sonderregel: zweites Heldendeck einmischen (erweitert auf Singleplayer)**
  - `Hero.buildCardstack()` (`hero.class.ts:18-26`) erweitern: bei `numberOfPlayers === 2`
    zusätzlich das Kartendeck eines zweiten, von den Mitspielern nicht gewählten Helden
    einmischen (Auswahl: entweder empfohlene Kombination aus der Anleitung fix hinterlegen —
    Jägerin+gelb, Magier+lila — oder pro Spieler frei wählbar machen; Empfehlung: zunächst die
    feste Kombination aus der Anleitung, da geringerer UI-Aufwand).
  - Prüfen, ob `HeropowerContainerComponent`/`HeropowerService` beim Ausspielen von Karten aus
    dem zweiten Deck weiterhin korrekt der ursprünglichen Heldenfähigkeit zugeordnet bleiben
    (Fähigkeit hängt am gewählten Helden, nicht am Kartendeck).
  - Verifikation: `ng build`, `ng test`; manueller 2-Spieler-Test, Deckgröße 80 prüfen.

- [x] **TODO 4 — Kampagne über alle 5 Bosse**
  - `GameFactoryService.buildNewGame()` (`game-factory.service.ts:14,26-30`) so ändern, dass der
    erste Boss weiterhin `'Baby-Barbar'` ist, aber `EncounterState`/`Game` eine
    „aktueller Boss-Index"-Information hält (kann `allBosses` + Index sein, statt reinem
    `currentBoss`-Namen).
  - `CardPlayService`-Stelle, die bei leerem Boss-Token `gameStatus: 'won'` setzt
    (`card-play.service.ts:220-222`), aufteilen: wenn ein nächster Boss in `allBosses` existiert,
    neuen Dungeon vorbereiten (neue Dungeon-/Quest-Karten mischen, Boss-Tableau wechseln, Timer
    auf 5 Minuten zurücksetzen, „Startet ins Abenteuer"-Ablauf aus Anleitung S. 3/6 nachbilden);
    nur nach Boss #5 tatsächlich `'won'` setzen.
  - Prüfen, ob `EncounterState`/`CurrentGameSelectors` (siehe
    `docs/planned/currentGame-state-split-plan.md`) bereits Felder für „nächster Boss" vorsehen,
    sonst dort ergänzen — Rücksprache mit diesem Plan halten, da er den State parallel umbaut.
  - Firestore: Falls neue Felder am `Game`-Dokument nötig sind, `firestore.rules` +
    `firestore.rules.test.js` mitziehen.
  - Verifikation: `ng build`, `ng test`, `npm run test:rules`; manueller Test „Boss #1 besiegen →
    Boss #2 (Der Flecken-Schrecken) erscheint mit neuen Dungeon-Karten, Timer läuft neu".

- [ ] **TODO 5 — Timer-Pause-Mechanismus (Grundlage für Magier + Walküre)**
  - `Game`-Modell (`src/models/game.ts`) um ein Pause-Feld erweitern (z.B. `timerPausedAt:
    number | null` oder `isPaused: boolean`), Reducer in dem für Timer zuständigen State
    ergänzen (State-Zuordnung gemäß `src/app/states/CLAUDE.md` prüfen).
  - `GameComponent`s Countdown-Anzeige (`game.component.ts:48-61`,
    `markGameLostWhenTimerRunsOut()` :90-105) so anpassen, dass bei `isPaused === true` der
    Countdown nicht weiterläuft (rein UI-seitig reicht evtl. nicht, da Firestore die Quelle der
    Wahrheit ist — Ablaufzeit als Serverzeitstempel + „verbleibende pausierte Dauer" modellieren,
    nicht als reine Client-Uhr, sonst laufen die Timer der Mitspieler auseinander).
  - Verifikation: `ng build`, `ng test`; noch kein UI-Trigger nötig, reine Infrastruktur — wird
    von TODO 6 genutzt.

- [ ] **TODO 6 — Magier „Zeit einfrieren" und Walküre „Göttlicher Schild" implementieren**
  - `heropower.component.ts:64-66` (`heroPowerMagier`) und
    `heropower-container.component.ts:66-67` (`case 'Magier': break;`) mit echter Logik füllen:
    3 Handkarten ablegen → `isPaused` aus TODO 5 setzen.
    „Timer bleibt eingefroren, bis ein Spieler eine Karte in die Tischmitte spielt" (S. 8) — d.h.
    `CardPlayService.chooseCard()` (bzw. die zentrale Stelle, an der Ressourcen-/Aktionskarten in
    die Tischmitte gespielt werden) muss beim nächsten Kartenausspielen `isPaused` wieder
    zurücksetzen. Heropower-Nutzung selbst (auch das Ablegen der 3 Karten für weitere
    Fähigkeiten) darf laut Anleitung (S. 6, Achtung Punkt 3) den Timer NICHT wieder freigeben.
  - Walküre „Göttlicher Schild" (Kartenname `göttlicherSchild`, aktuell nur Deck-Eintrag
    `hero-definitions.ts:69`): als Aktionskarte behandeln, die beim Ausspielen `isPaused` setzt
    und jedem Spieler erlaubt, 1 Karte vom eigenen Nachziehstapel zu ziehen — analog zu den
    bestehenden Aktionskarten-Auflösungen in `heropower.service.ts` als Vorbild nehmen, auch wenn
    „Göttlicher Schild" strenggenommen keine Heldenfähigkeit, sondern eine normale Aktionskarte
    ist (dementsprechend über den regulären Kartenausspiel-Pfad lösen, nicht über
    `heropower.service.ts`).
  - Verifikation: `ng build`, `ng test`; manueller 2-Spieler-Test „Magier friert Zeit ein, Timer
    pausiert bei allen Clients, nächste gespielte Karte startet ihn wieder".

- [x] **TODO 7 — Restliche Heldenfähigkeiten/Aktionskarten implementieren**
  - Einzeln nacheinander (jede für sich verifizierbar), Vorbild sind die bestehenden Muster in
    `heropower.service.ts` (Zielspieler-Auswahl via Dialog wie bei Jägerin, siehe
    `dialog-heropower.component.ts`) bzw. reguläre Aktionskarten-Auflösung:
    - Dieb „Spende" (Handkarten an Mitspieler abgeben + auf Starthandgröße nachziehen)
    - Dieb „Stehlen" (Handkarten eines Mitspielers übernehmen)
    - Jägerin/Waldläufer „Heilkräuter" (Zielspieler nimmt 4 Karten vom eigenen Ablagestapel auf
      die Hand zurück)
    - Barbar/Gladiator „Wut" (zwei frei wählbare Spieler ziehen je 3 Karten vom Nachziehstapel)
    - Paladin/Walküre „Heilige Handgranate" (besiegt sofort jede Bedrohung inkl. Mini-Boss/Boss —
      einzige Karte mit dieser Sonderregel, siehe TODO 8 Abhängigkeit)
    - Paladin/Walküre „Heilung" (Zielspieler legt kompletten Ablagestapel verdeckt zurück auf den
      Nachziehstapel)
    - Paladin/Walküre „Heiltrank" (alle Spieler nehmen 3 Karten vom eigenen Ablagestapel auf die
      Hand zurück)
  - Jede Karte braucht einen Prüfpfad, ob genug Karten zum Ablegen (Heldenfähigkeiten, 3 Karten)
    bzw. zum Ziehen (Aktionskarten mit Zielspieler) vorhanden sind — Anleitung S. 6 „Achtung"
    Punkt 1: ohne 3 ablegbare Handkarten keine Fähigkeitsnutzung.
  - Verifikation je Karte: `ng build`, `ng test`, manueller Test mit der jeweiligen Karte in
    einer laufenden Partie.

- [ ] **TODO 8 — Joker- und Bombenkarten spielbar machen**
  - `CardPlayService.chooseCard()`/die Matching-Logik (`card-play.service.ts:82-101`) um zwei
    Sonderfälle erweitern: `joker`-Karten zählen als beliebiges der aktuell auf der Dungeon-Karte
    geforderten Symbole (freie Wahl, ggf. UI-Auswahl nötig, falls mehrere Symbole gefordert
    sind); `magischeBombe`-Karten zählen als alle 5 Symbole gleichzeitig (können auch nur
    teilweise „verbraucht" werden, siehe Anleitung S. 8: „Ihr müsst nicht alle Symbole nutzen").
  - Verifikation: `ng build`, `ng test`; manueller Test „Joker gegen eine Dungeon-Karte mit
    einzelnem Symbol ausspielen", „Magische Bombe gegen Mehrsymbol-Karte ausspielen".

- [ ] **TODO 9 — Event-Handling im Mehrspieler-Modus + Verhinderung-Karte**
  - `isSoloEventActive()`-Gate (`player-hand.component.ts:168-170`) entfernen bzw. so erweitern,
    dass `resolveSoloEvent()` (besser umbenennen, da nicht mehr solo-spezifisch) auch im
    Mehrspieler-Modus greift, sobald eine Ereigniskarte aufgedeckt wird — unabhängig von
    `currentNumberOfPlayers()`.
  - Regelwidrige automatische Event-Auflösung durch beliebige Doppelkarten entfernen
    (`card-play.service.ts:70-81`, `isEventCard`-Zweig): Events dürfen nur durch die spezifische
    Magier-Aktionskarte „Verhinderung" gestoppt werden. „Verhinderung" muss dafür als eigene
    Aktionskarte mit Sonderlogik ergänzt werden (aktuell kein Treffer im Code für diesen
    Kartennamen — vermutlich bislang nicht im Deck modelliert, prüfen und ggf. in
    `hero-definitions.ts` beim Magier/Zauberin-Deck ergänzen).
  - Restliche Mini-Boss-/Event-Quest-Karten aus `monster-collection.data.ts:4-18,34-38,44-53`
    reaktivieren (auskommentierten Code prüfen, Texte/Effekte gegen Anleitung S. 9 abgleichen),
    sofern sie nicht aus anderem Grund bewusst deaktiviert wurden (git-history/Commit-Message
    dazu vor Reaktivierung kurz prüfen).
  - Verifikation: `ng build`, `ng test`, `npm run test:rules` falls Quest-Karten-Struktur sich
    ändert; manueller Test „Event-Karte im 2-Spieler-Spiel aufdecken, Effekt wird sofort
    ausgeführt, Verhinderung stoppt es".

- [ ] **TODO 10 — Mini-Bosse vor Heldenfähigkeiten schützen**
  - Voraussetzung: TODO 9 (Mini-Bosse reaktiviert). In `HeropowerService.resolveArrayHeropower()`
    (`heropower.service.ts:206-240`) prüfen, dass der aktuelle Gegner-Typ `Monster`, `Person`
    oder `Hindernis` ist, nicht ein Mini-Boss-Typ — sonst Fähigkeit ablehnen (UI-Feedback: „Diese
    Fähigkeit wirkt nicht gegen Mini-Bosse").
  - Verifikation: `ng build`, `ng test`; manueller Test „Heropower gegen Mini-Boss versuchen,
    wird abgelehnt; Heilige Handgranate (TODO 7) funktioniert trotzdem, da Sonderregel".

- [ ] **TODO 11 — Fehlende Verlustbedingungen ergänzen**
  - Prüfung „kein Spieler hat mehr Handkarten (und keiner kann/darf mehr ziehen)" nach jedem
    Kartenausspielen/Ablegen ergänzen, analog zur bestehenden Timer-Verlust-Prüfung in
    `game.component.ts:90-105` bzw. zentraler in `CardPlayService`, falls dort der bessere Ort
    ist (State-Zuständigkeit gemäß `src/app/states/CLAUDE.md` klären).
  - Prüfung „Gruppe kann die aktuell geforderten Symbole nicht aufbringen" ist die komplexeste
    TODO hier: erfordert, über alle Spieler-Hände hinweg zu prüfen, ob eine Kombination aus
    Ressourcenkarten/Aktionskarten/Heropower-Optionen die aktuelle Dungeon-Karte theoretisch noch
    lösen könnte. Scope für den ersten Wurf klein halten (z.B. nur „niemand hat mehr passende
    Ressourcen-/Aktionskarten auf der Hand UND niemand kann eine Heropower nutzen, die den
    aktuellen Gegnertyp besiegt UND kein Nachziehstapel-Karten mehr verfügbar" als
    Mindestbedingung), Rest ggf. als Folge-TODO auslagern.
  - Verifikation: `ng build`, `ng test`; manueller Test für beide neuen Verlustwege.

## Verifikation (gesamt)

Nach Abschluss aller TODOs: `ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI`,
`npm run test:rules` grün. Offen bleibt in jedem Fall ein manueller Mehrspieler-Smoke-Test über
mindestens zwei Browser-Sessions mit echtem Firebase/Firestore (kein Emulator-Setup in dieser
Session verfügbar) — deckt insbesondere TODO 3 (2-Spieler-Doppeldeck), TODO 4 (Boss-Kampagne)
und TODO 6 (Timer-Pause-Synchronisierung über Clients hinweg) ab, da diese Effekte clientübergreifend
konsistent sein müssen und sich nicht allein durch Unit-Tests absichern lassen.

Empfehlung zur Reihenfolge: TODO 1-2 (klein, isoliert) zuerst, dann TODO 5-6 (Timer-Pause) vor
TODO 7 (viele weitere Karten hängen an ähnlicher Infrastruktur), TODO 3 und TODO 4 unabhängig
voneinander einschiebbar, TODO 8-11 zuletzt, da sie auf stabilerem Kartenausspiel-Pfad aufbauen.
