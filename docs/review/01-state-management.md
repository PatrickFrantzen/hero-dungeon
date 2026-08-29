# Code-Review: State-Management (NGXS Actions/Selectors/States)

## Überblick

Geprüft wurden alle Dateien unter `src/app/actions/` (7), `src/app/selectors/` (6) und
`src/app/states/` (7), inkl. Abgleich mit den Aufrufstellen in `src/app/components/` und
`src/app/services/`. Hinweis zum Ist-Zustand (abweichend von CLAUDE.md): Die Komponenten sind
bereits auf Standalone/Signals migriert (`store.selectSignal(...)`), NGXS selbst ist aber
unverändert im „klassischen" Reducer-Stil (`@Action`, `ctx.setState`/`ctx.patchState`,
`@Selector`-Klassen) — kein `createSelector`, keine Signal-States, keine NGXS-Facades.

Gesamteindruck: Die States sind funktional klein und meist auf ein Firestore-Feld gemappt, das
Muster (`if (!x) return; const state = ctx.getState(); ctx.setState({...state, x})`) wird aber
über sieben Dateien hinweg fast wortgleich wiederholt (klarer DRY-Verstoß), und
`currentGame-state.ts` bündelt mehrere fachlich unabhängige Verantwortlichkeiten in einem
State (SRP-Verstoß). Der schwerwiegendste Einzelfund ist toter Code: `monsterStack-state.ts`
(`MobState`) wird nirgends registriert und ist im laufenden Betrieb komplett wirkungslos,
während eine zweite, tatsächlich aktive Monster-Datenhaltung in `currentGame-state.ts`
existiert — eine echte Zwei-Wahrheiten-Quelle im Repo, auch wenn nur eine davon läuft.

## Befunde

### 1. `MobState` (`monsterStack-state.ts`) ist toter Code — parallele, nie aktive Monster-Datenhaltung
**Kritisch**
**Betroffene Dateien:** `src/app/states/monsterStack-state.ts` (ganze Datei, 63 Zeilen),
`src/app/app.config.ts:11-30`, `src/app/states/currentGame-state.ts:134-157`

**Problem:** `app.config.ts:27` registriert im `provideStore([...])`-Array nur
`cardsInHandState, CardStackState, CurrentGameState, CurrentUserState, DeliveryStackState,
heropowerState` — `MobState` fehlt. Ein NGXS-`@State`, das nicht in `provideStore` registriert
ist, empfängt keine Actions und wird nie instanziiert. Trotzdem hört `MobState` per
`@Action(CreateNewMobAction)` und `@Action(UpdateMobAction)` (`monsterStack-state.ts:34,49`) auf
exakt dieselben Actions, die `startscreen.component.ts:107,130` und
`player-hand.component.ts:142,490` tatsächlich dispatchen — nur dass diese Dispatches bei
`CurrentGameState.updateMob` (`currentGame-state.ts:134-157`) landen, welches `state.game.Mob`
setzt. Es gibt also zwei parallele Reducer für "die Monster-Liste aktualisieren"
(`MobModel.enemys` vs. `CurrentGameModel.game.Mob`), von denen nur einer je feuert.
Es existiert außerdem kein Selector, der `MobState`/`MobModel` je liest — kein Treffer für
`MobModel` oder `enemys` in `src/app/selectors/`. Zusätzlich importiert
`monsterStack-state.ts:8-9` `CurrentGameState` und `CurrentGameSelectors`, verwendet aber
keines von beidem (toter Import).

**Vorschlag:** `monsterStack-state.ts` komplett entfernen (inkl. der zugehörigen
`CreateNewMobAction`/`UpdateMobAction`-Doppel-Zuständigkeit klären: die tatsächlich aktive
Logik lebt in `CurrentGameState`, dort bleibt sie). Vor dem Löschen kurz git-blame/Historie
prüfen, ob das Auslassen aus `app.config.ts` ein Versehen bei der Standalone-Migration war
(dann wäre zu klären, ob `Mob`-State ursprünglich getrennt vom `Game`-State gedacht war) oder
bewusst so belassen wurde, weil `CurrentGameState` die Aufgabe bereits übernommen hat.

### 2. `currentGame-state.ts` vermischt mehrere fachliche Verantwortlichkeiten in einem State (SRP)
**Wichtig**
**Betroffene Dateien:** `src/app/states/currentGame-state.ts:1-233`

**Problem:** Der `CurrentGameModel` (`currentGame-state.ts:17-20`) und seine sieben Actions
decken mindestens vier fachlich unabhängige Bereiche ab, die unabhängig voneinander ändern:
- Spiel-Identität/Metadaten: `CurrentGameAction` (Zeile 49-61, `items`/`gameId`),
  `CurrentGameData` (Zeile 63-75, kompletter `Game`-Datensatz)
- Gegner-/Encounter-State: `UpdateMonsterTokenArray` (Zeile 77-107), `SetNewEnemy`
  (Zeile 109-132), `UpdateMobAction` (Zeile 134-157)
- Spieler-/Lobby-State: `updateChoosenHeros` (Zeile 159-194, append), `SetChoosenHeros`
  (Zeile 196-214, replace)
- Quest-Flag: `updateQuestCardActivated` (Zeile 216-232)

Das ist die größte State-Datei im Scope (233 Zeilen) und mit Abstand die aktivste
Änderungsfläche — jede neue Karten-, Encounter- oder Lobby-Anforderung landet hier, obwohl die
Bereiche keine gemeinsame Änderungsursache haben (klassischer SRP-Verstoß: "ein Grund pro
Klasse, sich zu ändern" ist hier vierfach verletzt). Die Aufteilung erschwert außerdem Review
und Testbarkeit: Ein PR, der nur `questCardActivated` ändert, berührt dieselbe Datei wie einer,
der die Gegner-Logik ändert.

**Vorschlag:** Aufteilen in mindestens `GameMetaState` (Identität, `numberOfPlayers`,
`difficulty`, `isLost`, `gameId`), `EnemyState`/`EncounterState` (`currentEnemy`, `currentBoss`,
`Mob`, `allBosses`, Token-Array), `LobbyState`/`PlayersState` (`choosenHeros`) und ggf.
`questCardActivated` entweder im Meta-State belassen oder zu einem generischen
`QuestState` machen, falls weitere Quest-Karten-Flags dazukommen. Reihenfolge unkritisch, aber
`choosenHeros` (Lobby) ist der unabhängigste Teil und eignet sich als erster Schnitt mit dem
geringsten Kopplungsrisiko zu den Encounter-Reducern.

### 2b. `CurrentGameData` überschreibt den kompletten `Game`-Datensatz, obwohl gezielte Actions existieren
**Nice-to-have** (Ergänzung zu Befund 2)
**Betroffene Dateien:** `src/app/states/currentGame-state.ts:63-75`

**Problem:** `setGameData` ersetzt `state.game` komplett per `ctx.setState({...state, game:
gameData})`. Das überschreibt implizit auch `currentEnemy`, `Mob`, `choosenHeros` usw., die an
anderer Stelle über eigene, gezieltere Actions (`SetNewEnemy`, `SetChoosenHeros`,
`UpdateMobAction`) gepflegt werden. Wird `CurrentGameData` nach einem dieser gezielten Updates
dispatcht (z.B. bei einem erneuten vollständigen Firestore-Read), können bereits im Store
vorhandene, aktuellere Teilzustände wieder zurückgesetzt werden — eine potenzielle
Race-Condition zwischen Firestore-Sync (voller Read) und den granularen NGXS-Actions, abhängig
von der Dispatch-Reihenfolge in den Komponenten. Das ist aus dem State-Code allein nicht
abschließend zu verifizieren (hängt von der Aufrufreihenfolge in `game.component.ts`/
`player-hand.component.ts` ab, die außerhalb dieses Scopes liegen), aber das Store-Design
selbst bietet keinen Schutz dagegen.

**Vorschlag:** Bei der Aufteilung aus Befund 2 mit klären, ob `CurrentGameData` weiterhin den
gesamten `Game`-Blob ersetzen soll, oder ob nach der Aufteilung jeder Teil-State nur noch seinen
eigenen Slice aus einem vollständigen Firestore-Read übernimmt (dann keine versehentliche
Rücksetzung von Feldern, die ein anderer Teil-State verwaltet).

### 3. Wiederholtes „state manuell aus allen Feldern neu zusammenbauen"-Muster (DRY, OCP)
**Wichtig**
**Betroffene Dateien:** `src/app/states/currentGame-state.ts:88-106, 117-131, 142-156`

**Problem:** `updateMonsterTokenArray`, `updateNewEnemy` und `updateMob` schreiben jeweils
**alle neun Felder** von `Game` einzeln aus, obwohl nur eines sich ändert:

```ts
// currentGame-state.ts:117-131 (updateNewEnemy) — identisch mit Zeile 88-106 und 142-156,
// nur die hervorgehobene Zeile unterscheidet sich
ctx.patchState({
  ...state,
  game: {
    numberOfPlayers: state.game.numberOfPlayers,
    currentEnemy: enemy,                    // <- einziges geändertes Feld
    choosenHeros: state.game.choosenHeros,
    currentBoss: state.game.currentBoss,
    isLost: state.game.isLost,
    gameId: state.game.gameId,
    difficulty: state.game.difficulty,
    Mob: state.game.Mob,
    allBosses: state.game.allBosses,
    questCardActivated: state.game.questCardActivated,
  },
});
```

Das ist zum einen redundant (dieselben acht Zeilen dreimal kopiert), zum anderen ein
Open/Closed-Verstoß: Jedes neue Feld in `Game` (`src/models/game.ts`) muss in **allen drei**
Reducern manuell nachgetragen werden, sonst geht es beim jeweils nächsten Dispatch dieser
Action stillschweigend verloren. Andere Reducer in derselben Datei (`updateChoosenHero`,
`setChoosenHeros`, `updateQuestCardActivated`, Zeile 187-232) nutzen bereits korrekt
`...state.game` und sind dadurch automatisch robust gegen neue `Game`-Felder — die
Inkonsistenz ist also auch ein Stilbruch innerhalb derselben Datei.

**Vorschlag:** Die drei betroffenen Reducer auf `game: { ...state.game, currentEnemy: enemy }`
etc. umstellen (analog zu `updateChoosenHero`/`updateQuestCardActivated`). Funktional identisch,
aber ohne die manuelle Feldliste. Kein Verhaltensunterschied zu erwarten, da `patch`/`setState`
mit Objekt-Spread hier ohnehin nur ein flaches Merge auf `game`-Ebene macht.

### 4. Wiederkehrende `patchState`/`setState`-Boilerplate über alle States hinweg (DRY)
**Nice-to-have**
**Betroffene Dateien:** `src/app/states/cardStack-state.ts:26-65`,
`src/app/states/cardsInHand-state.ts:25-86`, `src/app/states/deliveryStack-state.ts:20-53`,
`src/app/states/currentUser-state.ts:33-73`, `src/app/states/heropower-state.ts:21-44`

**Problem:** In allen fünf Dateien wiederholt sich exakt dasselbe Skelett:

```ts
const { X } = action;
if (!X) { return; }
const state = ctx.getState();
ctx.setState({ ...state, feld: X });   // oder ctx.patchState(patch<Model>({ feld: X }))
```

Zusätzlich uneinheitlich, welcher der beiden NGXS-Mechanismen verwendet wird: „Create"/„Get"-
Actions nutzen durchgehend `ctx.setState({...state, ...})` (z.B. `cardStack-state.ts:40-43`,
`cardsInHand-state.ts:41-44`, `deliveryStack-state.ts:32-35`), „Update"-Actions nutzen
`ctx.setState(patch<Model>({...}))` (z.B. `cardStack-state.ts:60-64`,
`cardsInHand-state.ts:81-85`). Beide erzielen hier denselben Effekt (einziges Top-Level-Feld
ersetzen), der Wechsel zwischen den beiden APIs ist aber nicht durch einen fachlichen
Unterschied motiviert, sondern wirkt wie zwei verschiedene Autoren/Zeitpunkte — reine
Stil-Inkonsistenz. Für sich genommen unkritisch (die Dateien sind klein), aber bei sieben+
States lohnt sich eine gemeinsame Konvention.

**Vorschlag:** Auf einen der beiden Stile vereinheitlichen (der `patch()`-Operator aus
`@ngxs/store/operators` ist der modernere NGXS-Idiom-Ansatz und spart die manuelle
`{...state, ...}`-Spreads) — kein Utility-Wrapper nötig, dafür ist das Muster zu simpel; eine
kurze Konventionsnotiz (z.B. in einem README unter `src/app/states/`) reicht, um künftige
State-Dateien konsistent zu halten.

### 5. Namens-/Casing-Inkonsistenzen zwischen Datei-, Klassen- und Action-Namen
**Wichtig**
**Betroffene Dateien:** `src/app/selectors/currentUser-selectos.ts` (ganze Datei),
`src/app/states/cardsInHand-state.ts:24`, `src/app/states/heropower-state.ts:19`,
`src/app/actions/currentGame-action.ts:24,34`, `src/app/actions/currentUser-action.ts:7`

**Problem:**
- Datei-Tippfehler: `currentUser-selectos.ts` statt `currentUser-selectors.ts` — betrifft nur
  den Dateinamen (Klasse heißt korrekt `CurrentUserSelectors`, `currentUser-selectos.ts:5`),
  wird aber an sieben Importstellen in Components/Services mitgeschleppt (z.B.
  `player-hand.component.ts:40`, `game.component.ts:7`, `heropower.component.ts:4`).
- Klassennamen-Casing uneinheitlich: State-Klassen sind überwiegend PascalCase
  (`CardStackState`, `CurrentGameState`, `CurrentUserState`, `DeliveryStackState`), aber
  `cardsInHandState` (`cardsInHand-state.ts:24`) und `heropowerState`
  (`heropower-state.ts:19`) sind camelCase — TypeScript-Konvention verlangt PascalCase für
  Klassen; das fällt beim Import auch optisch auf (`import { cardsInHandState } from
  './states/cardsInHand-state'`, `app.config.ts:11`).
- Dasselbe Muster bei Action-Klassen in `currentGame-action.ts`: `updateChoosenHeros` (Zeile 24)
  und `updateQuestCardActivated` (Zeile 34) sind camelCase, während im selben File
  `CurrentGameAction`, `CurrentGameData`, `UpdateMonsterTokenArray`, `SetNewEnemy`,
  `SetChoosenHeros` PascalCase sind.
- Tippfehler in einem Action-Kommentar/Namen: `CurrentUserHeroAction` in
  `currentUser-action.ts:7` — `'[Startscreen Page] Fetchin current User Hero'` (fehlendes „g" in
  „Fetching"). Kein funktionaler Fehler (nur der `type`-String für NGXS-Devtools/Logging), aber
  leicht zu vermeiden.

**Vorschlag:** Datei in `currentUser-selectors.ts` umbenennen (Import-Fundstellen mit
suchen/ersetzen anpassen — reine Mechanik, kein Verhaltensunterschied). Klassennamen
`cardsInHandState` → `CardsInHandState`, `heropowerState` → `HeropowerState`,
`updateChoosenHeros` → `UpdateChoosenHeros`, `updateQuestCardActivated` →
`UpdateQuestCardActivated` (Achtung: in `currentGame-state.ts:216-232` heißt sowohl die
Action-Klasse als auch die Reducer-Methode `updateQuestCardActivated` — beim Umbenennen der
Action-Klasse den Methodennamen nicht mit umbenennen, das wäre eine unabhängige Änderung).
Reine Umbenennungen, keine Logikänderung — eigener kleiner Schritt gemäß CLAUDE.md
„kleine, verifizierbare Schritte", da viele Importstellen betroffen sind.

### 6. Tote/verwirrende Importe in Selector-Dateien
**Nice-to-have**
**Betroffene Dateien:** `src/app/selectors/currentHand-selector.ts:1-10`

**Problem:** `currentHand-selector.ts` importiert `CurrentGameModel` und `CurrentGameState`
(Zeile 3-5) sowie `CardStack` (Zeile 10), verwendet aber ausschließlich
`CardsInHandStateModel`/`cardsInHandState` (Zeile 13-16). Die drei ungenutzten Importe deuten
auf eine frühere Version des Selectors hin (evtl. als der Hand-State noch Teil von
`CurrentGameState` war) und erschweren das Verständnis, welcher State hier tatsächlich gelesen
wird.

**Vorschlag:** Ungenutzte Importe entfernen. Kandidat für eine kurze Lint-Regel
(`no-unused-vars`/`@typescript-eslint/no-unused-vars`), sobald – wie in CLAUDE.md vermerkt –
ESLint eingeführt wird; das hätte diesen Fund automatisch markiert.

### 7. Lokale Variablen schatten den Typnamen (Lesbarkeit)
**Nice-to-have**
**Betroffene Dateien:** `src/app/states/cardStack-state.ts:37`,
`src/app/states/cardsInHand-state.ts:37` (dort `HandCards`, kein direkter Schatten, aber
gleiches Muster), `src/app/states/monsterStack-state.ts:41,55`

**Problem:** `cardStack-state.ts:37` deklariert `const CardStack: CardStack = { cardstack };` —
eine lokale Variable, die exakt so heißt wie der importierte Typ `CardStack`
(`src/models/helden/card.class.ts:5`). Analog `monsterStack-state.ts:41,55`:
`const Mob: Mob[] = mob;` schattiert den Typ `Mob` aus `src/models/monster/monster.class.ts`.
Funktioniert in TypeScript (Groß-/Kleinschreibung von Typ- vs. Wertnamensraum sind getrennte
Scopes), ist aber beim Lesen verwirrend und in anderen Dateien im selben Scope (z.B.
`cardsInHand-state.ts:37: const HandCards: CardStack = ...`) wird korrekt ein eigener Name
gewählt — auch hier uneinheitlich.

**Vorschlag:** Variablen konsequent klein/eigenständig benennen (`const cardStack: CardStack =
...`, `const updatedMob: Mob[] = ...`), analog zum bereits korrekten `HandCards`-Beispiel.

### 8. Wiederholtes „Heropower zurücksetzen"-Actionpaar ohne eigene Action (DRY, konsumentenseitig)
**Nice-to-have**
**Betroffene Dateien:** `src/app/actions/heropower-action.ts:1-9`,
`src/app/services/dieb-service.service.ts:50-51`, `src/app/components/player-hand/
player-hand.component.ts:178-179,311-312,538-539` (auskommentiert auch 588-589),
`src/app/components/heropower/heropower.component.ts:41-42`

**Problem:** Zwar außerhalb des Scopes „Komponenten" im Detail, aber als Konsequenz des
Actions-Designs relevant: `UpdateHeropowerActivated(false)` gefolgt von
`UpdateHeropowerArray([])` wird an mindestens vier Call-Sites paarweise dispatcht, um den
Heropower-State zurückzusetzen (`dieb-service.service.ts:50-51`,
`player-hand.component.ts:178-179`, `player-hand.component.ts:311-312`,
`player-hand.component.ts:538-539`, `heropower.component.ts:41-42`). Es gibt keine
`ResetHeropowerAction`, die beide Felder atomar in einem Reducer zurücksetzt — jede Aufrufstelle
muss wissen, dass zwei Actions in dieser Reihenfolge nötig sind, und zwei separate
Store-Updates (zwei Reducer-Durchläufe, zwei Change-Detection-Zyklen) statt einem lösen aus.

**Vorschlag:** `ResetHeropowerAction` (ohne Payload) in `heropower-action.ts` ergänzen, Reducer
in `heropower-state.ts` setzt `heropowerActivated: false, heropowerArray: []` in einem
`patchState`-Aufruf. Reduziert fünf Zwei-Zeiler-Dispatch-Stellen auf einen Dispatch pro Stelle;
die Anpassung der Konsumenten selbst gehört in die Komponenten-/Service-Review-Datei, hier nur
als Beleg für den fehlenden State-Design-Baustein vermerkt.

### 9. Debug-`console.warn` in produktivem State-/Selector-Code
**Nice-to-have**
**Betroffene Dateien:** `src/app/selectors/currentUser-selectos.ts:24`,
`src/app/states/heropower-state.ts:43`

**Problem:** `currentUserHeroData` (Selector) loggt bei jedem Aufruf
`console.warn('currentUserSelector', state.hero)`, `updateHeropowerArray` (Reducer) loggt
`console.warn('ArrayState', ctx.getState())`. Selectors werden von NGXS memoized und potenziell
sehr häufig ausgewertet (jede Signal-Subscription, die den Selector nutzt) — ein `console.warn`
auf diesem Pfad ist Debug-Code, der es in den Hauptzweig geschafft hat, keine echte Warnung.

**Vorschlag:** Beide Zeilen entfernen (kein Ersatz-Logging nötig, da kein Error-Handling an
dieser Stelle vorgesehen ist — siehe CLAUDE.md „Bekannte Baustellen" zum fehlenden
Error-Handling generell).

## Priorisierte Empfehlungen

1. **Kritisch:** `MobState`/`monsterStack-state.ts` entfernen (Befund 1) — toter, nie
   registrierter State mit doppelter Zuständigkeit zu `CurrentGameState.updateMob`; birgt das
   Risiko, dass jemand künftig `MobState`/`MobModel` für aktiven Code hält und Zeit in dessen
   Debugging steckt.
2. **Wichtig:** `currentGame-state.ts` aufteilen (Befund 2) und dabei die drei
   Komplett-Feld-Reducer auf `...state.game`-Spread umstellen (Befund 3) — beides hängt
   zusammen und sollte in einem gemeinsamen, aber schrittweisen Umbau (pro Teil-State ein PR,
   gemäß CLAUDE.md „kleine, verifizierbare Schritte") angegangen werden.
3. **Wichtig:** Datei-/Klassen-/Action-Namenskonsistenz herstellen (Befund 5), allen voran
   `currentUser-selectos.ts` → `currentUser-selectors.ts`, da der Tippfehler an sieben
   Importstellen sichtbar ist und leicht behebbar ist.
4. **Nice-to-have, aber günstig:** Punkte 4, 6, 7, 9 (Boilerplate-Vereinheitlichung, tote
   Importe, Variablen-Shadowing, Debug-Logs) — geringer Aufwand, kein Verhaltensrisiko, gute
   Gelegenheit für einen „Aufräum"-PR vor oder nach der `currentGame-state.ts`-Aufteilung.
5. **Nice-to-have, componentseitig zu vervollständigen:** `ResetHeropowerAction` (Befund 8) —
   Umsetzung berührt auch Komponenten/Services außerhalb dieses Scopes, hier nur als
   State-Design-Lücke dokumentiert.
