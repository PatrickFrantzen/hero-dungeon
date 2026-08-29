# Code-Review: Kern-Komponenten (Game, PlayerHand, Enemy, Heropower)

## Status (2026-08-29, PR #21)

Befund 1 (tote Heropower-Stub-Methoden) war beim Prüfen bereits vor diesem Review behoben
(Commit `ed16685`, #20): `HeropowerContainerComponent` emittiert korrekt über `output()`, und
`PlayerHandComponent.onHeropowerResolved()` ruft die echten Methoden auf — kein Fix nötig.
Umgesetzt in PR #21: komplett auskommentierte, nirgends aufgerufene `checkDiebHeropower()`
entfernt, `console.warn`-Rest entfernt, leeres `AppComponent.ngOnInit()` entfernt (Teil von
Befund 9).

Offen, siehe [`docs/planned/player-hand-decomposition-plan.md`](../../planned/player-hand-decomposition-plan.md):
die eigentliche Entflechtung von `PlayerHandComponent` (Befund 2/3/4/5/7 — `CardPlayService`/
`HeropowerService`/`FirestoreSyncService`-Extraktion, Error-Handling für Firestore-Zugriffe) und
das Heropower-Strategy-Pattern (Befund 6) als Stretch-Goal desselben Plans. Nicht umgesetzt,
nice-to-have und noch nicht neu geplant: Template-Pipes/`track`-Key-Robustheit (Befund 8),
restliche Kleinigkeiten aus Befund 9 (`currentHero: Object` in `GameComponent`).

## Überblick

Untersuchte Dateien: `game.component.ts/.html`, `player-hand.component.ts/.html` (622 Zeilen —
größte Komponente im Projekt), `enemy.component.ts` + `enemy-container.component.ts`,
`heropower.component.ts` + `heropower-container.component.ts`, `app.component.ts`.

Der bereits abgeschlossene OnPush-Umbau (`docs/done/onpush-refactor-plan.md`) hat die
Signal-Migration und das Dual-Write-Problem in den Firestore-Callbacks gelöst und benennt
explizit als **nicht im Scope**: die generelle Vermischung von Firestore-Zugriff,
Geschäftslogik und UI in `PlayerHandComponent`. Genau das ist der Kern dieses Reviews — mit
einem zusätzlichen, funktionalen Befund (Nr. 1), der beim OnPush-Fokus nicht auffiel, weil er
kein Change-Detection-Problem ist, sondern ein stiller Logikfehler.

`GamePlayerService` (Issue #8, genutzt in `GameComponent`) und `DiebServiceService` (genutzt in
`HeropowerContainerComponent`) zeigen, dass das Muster "Firestore/Fachlogik raus aus der
Komponente, rein in einen `providedIn: 'root'`-Service" im Projekt bereits etabliert ist und
für `PlayerHandComponent` nur konsequent fortgesetzt werden müsste — die Vorlage existiert.

## Befunde

### 1. Tote/verschattete Heropower-Methoden in `HeropowerContainerComponent` — Heropowers von Walküre, Jägerin und den "Standard"-Helden feuern nie
**Priorität: kritisch (Funktionsfehler, kein reiner Stilbefund)**

**Betroffene Dateien:**
- `src/app/components/heropower/heropower-container/heropower-container.component.ts:45-82`
- `src/app/components/player-hand/player-hand.component.ts:147-180` (`checkWalkuereHeropower`),
  `:282-313` (`checkJaegerinHeropower`), `:501-541` (`checkheropowerArray`)

**Problem:** `HeropowerContainerComponent` besitzt einen `effect()`, der bei aktivierter
Heropower und drei ausgewählten Karten je nach Heldenname eine Methode gleichen Namens
aufruft:

```ts
// heropower-container.component.ts:52-72
switch (heroname) {
  case 'Gladiator': case 'Barbar': case 'Zauberin':
  case 'Waldläufer': case 'Ninja': case 'Paladin':
    this.checkheropowerArray();
    break;
  case 'Jägerin':
    this.checkJaegerinHeropower();
    break;
  case 'Dieb':
    this.diebService.heropower(heropowerArray)
    break;
  case 'Walküre':
    this.checkWalkuereHeropower();
    break;
}
```

Direkt darunter, in derselben Klasse, stehen jedoch **eigene, leere Stub-Implementierungen**:

```ts
// heropower-container.component.ts:77-81
checkheropowerArray() {}
checkJaegerinHeropower() {}
checkWalkuereHeropower() {}
```

`PlayerHandComponent` hat Methoden mit exakt denselben Namen und echter Logik
(`player-hand.component.ts:147`, `:282`, `:501`) — vermutlich der ursprüngliche Ort, von dem
aus die Karten-Rückgabe/Nachziehlogik aufgerufen werden sollte. Da `checkheropowerArray()` &
Co. aber **auf `this` in `HeropowerContainerComponent`** aufgerufen werden, gewinnt TypeScript
zwingend die lokalen leeren Methoden — die `PlayerHand`-Implementierungen werden nie erreicht.
Nur der Dieb-Pfad (`this.diebService.heropower(...)`, ausgelagert in
`src/app/services/dieb-service.service.ts`) funktioniert tatsächlich, weil dort kein
gleichnamiger lokaler Stub existiert.

**Effekt im Spiel:** Für Gladiator, Barbar, Zauberin, Waldläufer, Ninja, Paladin, Jägerin und
Walküre wird bei aktivierter Heropower zwar `UpdateHeropowerActivated`/`UpdateHeropowerArray`
gesetzt (Karten werden optisch "ausgewählt"), aber die eigentliche Wirkung (Karten aus der Hand
entfernen, Kartenstapel nachziehen, bei Walküre: Mitspielern Karten geben, bei Jägerin: Dialog
öffnen) passiert nicht — die Heropower verpufft wirkungslos. Das ist vermutlich ein Rest aus der
Standalone-/Container-Migration, bei der `checkheropowerArray` etc. in
`HeropowerContainerComponent` als Platzhalter angelegt, aber nie mit Aufrufen an
`PlayerHandComponent` verdrahtet wurden.

**Vorschlag:** Kein reines Review-Thema mehr, sondern ein Bugfix-Kandidat für ein eigenes
Issue. Fachlich gehört diese Logik ohnehin in einen Service (siehe Befund 6/7), nicht in die
Container-Komponente — der naheliegende Fix ist, die drei Stub-Methoden zu entfernen und
stattdessen (nach Extraktion, siehe unten) einen `HeropowerService` zu injizieren, den sowohl
`HeropowerContainerComponent` (zum Triggern) als auch `PlayerHandComponent` (für Hand/Stack)
nutzen — nicht implizite Methodennamens-Kollision zwischen zwei unabhängigen Komponenten.

---

### 2. `PlayerHandComponent`: Single-Responsibility eklatant verletzt — UI, Firestore-Zugriff, Spielregeln und State-Dispatch in einer Klasse
**Priorität: wichtig**

**Betroffene Datei:** `src/app/components/player-hand/player-hand.component.ts` (622 Zeilen,
21 Methoden)

**Problem:** Die Klasse vereint mindestens vier Verantwortlichkeiten:
1. Firestore-Subscriptions/-Reads (`ngOnInit:112-130`, `getAllPlayerDatatoGivePlayersCards:182-192`,
   `getOtherPlayerDataTogivePlayerCards:220-231`) — direkte `onSnapshot`/`getDocs`/`query`-Aufrufe.
2. Firestore-Writes über `SaveGameService` (`saveGame.updateHandstack/-Cardstack/-CurrentEnemyToken/-NewEnemy/-NewMob`
   — in praktisch jeder Methode ab Zeile 160).
3. Spielregeln (welche Karte passt auf welches Token, wann wird der nächste Gegner geladen,
   wie viele Karten darf eine Hand halten) — `chooseCard:315-380`, `checkForNextEnemy:436-447`,
   `checkHandsize:413-434`.
4. NGXS-State-Dispatch (`store.dispatch(...)` — über 25 Aufrufe in der Datei verteilt).

Das widerspricht dem Single-Responsibility-Prinzip direkt: Eine Änderung an der
Firestore-Datenstruktur (`handstack`/`cardstack`-Feldnamen), eine Änderung an den Kartenregeln
(z. B. neue "Doppelkarte"-Logik) und eine Änderung am UI-Verhalten (z. B. Handkarten nicht mehr
automatisch nachziehen) treffen alle dieselbe Datei — und dieselben Methoden.

**Vorschlag:** Siehe Befunde 6/7 (konkrete Extraktionsvorschläge). Referenz: `GameComponent`
zeigt bereits das Zielbild — Firestore-Zugriff komplett in `GamePlayerService` ausgelagert
(`src/app/services/game-player.service.ts`), die Komponente orchestriert nur noch
async/await + Dispatch. `PlayerHandComponent` ist die letzte große Komponente, die dieses
Muster noch nicht übernommen hat.

---

### 3. Massive Code-Duplikation zwischen den Heropower-Check-Methoden
**Priorität: wichtig**

**Betroffene Datei:** `player-hand.component.ts`

**Problem:** `checkWalkuereHeropower()` (Z.147-180), `checkJaegerinHeropower()` (Z.282-313) und
`checkheropowerArray()` (Z.501-541) sind zu ~80 % identischer Code:

```ts
// checkWalkuereHeropower(), Z.150-174
this.heropowerArray().forEach((card) => {
  let currHand = [...this.currentHand()];
  let currCardStack = [...this.currentCardStack()];
  let indexOfHandCard = this.currentHand().indexOf(card);
  currHand.splice(indexOfHandCard, 1);
  this.store.dispatch(new UpdateCurrentHandAction(currHand));

  if (currHand.length < 5 && currCardStack.length > 0) {
    let currCardStack = [...this.currentCardStack()];   // <- Shadowing der äußeren currCardStack!
    let currHand = [...this.currentHand()];             // <- Shadowing der äußeren currHand!
    const getCardForHand = currCardStack.shift()!;
    currHand.push(getCardForHand);
    this.saveGame.updateHandstack(this.currentGameId(), this.currentPlayerId(), currHand);
    this.saveGame.updateCardstack(this.currentGameId(), this.currentPlayerId(), currCardStack);
    this.store.dispatch(new UpdateCardStackAction(currCardStack));
    this.store.dispatch(new UpdateCurrentHandAction(currHand));
  }
});
```

`checkJaegerinHeropower()` (Z.284-309) ist **buchstäblich derselbe Block**, nur mit
`this.openDialog()` statt `this.getAllPlayerDatatoGivePlayersCards()` am Ende.
`checkheropowerArray()` (Z.513-537) enthält denselben inneren Block noch einmal, vorangestellt
mit dem "Gegner-Token leeren"-Teil, der auch in `playAsOneCard`/`checkheropowerArray` selbst
wiederkehrt (Token-Array leeren + `UpdateMonsterTokenArray` dispatchen +
`saveGame.updateCurrentEnemyToken` + `checkForNextEnemy` erscheint identisch in Z.348-354,
Z.452-457, Z.503-511).

Zusätzlich ist die innere Variablen-Schattierung (`let currHand`/`let currCardStack` erneut
deklariert mit gleichem Namen im inneren Block) verwirrend und fehleranfällig — beim Lesen
wirkt es wie ein Bug-Muster (die äußere Deklaration ist komplett wertlos, weil sie sofort
überschrieben wird), auch wenn es aktuell funktional keinen Unterschied macht.

`executeWalkuereHeropower()` (Z.194-218) und `executeJaegerinHeropower()` (Z.233-280) sind
ebenfalls stark redundant: Beide implementieren dieselbe "Karten vom Stack auf die Hand
nachziehen, N-mal wiederholen, dabei Firestore direkt beschreiben"-Schleife — nur die Anzahl der
Wiederholungen (2 vs. 4) und ob `this.store.dispatch(...)` zusätzlich zum Firestore-Write
passiert (nur im `if (this.currentPlayerId() === userId)`-Zweig von `executeJaegerinHeropower`,
Z.239-258) unterscheiden sich. `executeWalkuereHeropower()` dispatcht **gar nicht** in den
Store — nur Firestore-Write. Ob das beabsichtigt ist (weil dort immer ein *anderer* Spieler
betroffen ist, dessen State ohnehin über dessen eigene `onSnapshot`-Subscription aktualisiert
wird) oder ein vergessener Dispatch ist, ist aus dem Code nicht ersichtlich — sollte geklärt
werden, bevor man die beiden Methoden zusammenführt.

**Vorschlag:** Eine gemeinsame private Hilfsmethode `drawCardsToHandsize(hand, cardStack,
targetGameId, targetPlayerId): {hand, cardStack}` extrahieren, die "vom Stack nachziehen, bis
Hand voll oder Stack leer ist" kapselt (im Kern identisch zu `checkHandsize()`, Z.413-434, das
bereits genau das tut, aber nicht wiederverwendet wird!). `checkHandsize()` ist der Beweis, dass
die Autoren das Muster schon einmal sauber extrahiert haben — es wird nur an den drei
Heropower-Stellen nicht aufgerufen, sondern erneut copy-paste dupliziert.

---

### 4. Duplizierte Firestore-Boilerplate (query/getDocs/onSnapshot-Muster)
**Priorität: wichtig**

**Betroffene Datei:** `player-hand.component.ts:112-130`, `:182-192`, `:220-231`

**Problem:** Drei Methoden bauen denselben Aufbau aus `collection(this.db, 'games',
this.currentGameId(), 'player')` + `query(...)` + `where(...)` + (`onSnapshot`/`getDocs`)
jeweils neu:

```ts
// Z.118-121
const currentPlayerData = query(
  collection(this.db, 'games', this.currentGameId(), 'player'),
  where('userId', '==', this.currentPlayerId())
);
```
```ts
// Z.183-187
const allPlayerData = query(
  collection(this.db, 'games', this.currentGameId(), 'player'),
  where('gameId', '==', this.currentGameId()),
  where('userId', '!=', this.currentPlayerId())
);
```
```ts
// Z.221-224
query(
  collection(this.db, 'games', this.currentGameId(), 'player'),
  where('userId', '==', this.playerIdForHeropowerAction)
)
```

Diese Pfad-Konstruktion (`games/{gameId}/player`) taucht zusätzlich in `SaveGameService` und
`GamePlayerService` wiederholt auf (`doc(this.db, 'games', gameId, 'player', playerId)` — je
einmal pro Methode). Kein zentraler Ort kennt die Firestore-Collection-Struktur; ändert sich der
Pfad (z. B. `player` → `players`), muss an >10 Stellen im Projekt gesucht werden.

**Vorschlag:** Ein `FirestoreSyncService`/`GameRepository` (Name analog zu `GamePlayerService`),
der Pfad-Konstruktion, Queries und die beiden `onSnapshot`-Callbacks aus
`PlayerHandComponent.ngOnInit()` kapselt und beobachtbare Streams (`Observable<Game>`,
`Observable<PlayerDoc>`) statt roher `DocumentData` zurückgibt. `PlayerHandComponent.ngOnInit()`
würde dann nur noch abonnieren und dispatchen (vgl. das Zielmuster in `GameComponent`).

---

### 5. Fehlendes Error-Handling bei Firestore-Aufrufen
**Priorität: wichtig**

**Betroffene Dateien:**
- `player-hand.component.ts:113-129` (`ngOnInit` — `await getDoc(...)`, `onSnapshot(...)`),
  `:182-192`, `:220-231` (`await getDocs(...)`)
- `src/app/services/save-game.service.ts` — alle `updateDoc(...)`-Aufrufe (z. B. Z.15-18,
  20-24, 27-32) sind fire-and-forget, kein `await`, kein `.catch()`, kein Return-Promise, das
  der Aufrufer prüfen könnte.

**Problem:** Anders als `GameComponent` (die in `checkIfPlayerIsAlreadyPartOfGame()`,
`game.component.ts:56-71`, und `openDialog()`, Z.106-117, sauber `try/catch` mit
`loadError.set(...)` nutzt) hat `PlayerHandComponent` **kein einziges** `try/catch` um
Firestore-Zugriffe. Bei einem Verbindungsabbruch während `getDoc(docRef)` in `ngOnInit` (Z.115)
wirft die Methode eine unbehandelte Promise-Rejection; die UI zeigt nichts an, der Spieler sieht
kein Feedback. `SaveGameService.updateHandstack/-Cardstack/-...` (die meistgenutzten
Schreibpfade im ganzen Spiel — jeder Kartenzug ruft mindestens zwei davon auf) schlucken Fehler
komplett: Ein fehlgeschlagenes `updateDoc` bleibt sowohl der Komponente als auch dem Nutzer
unbekannt, der lokale NGXS-State läuft dann aus dem Ruder, weil er per Dispatch bereits
optimistisch aktualisiert wurde, obwohl der Server-Schreibvorgang fehlgeschlagen ist.

**Vorschlag:**
- `SaveGameService`-Methoden auf `Promise<void>` umstellen (`return updateDoc(...)` statt
  `updateDoc(...)` als Fire-and-forget) und im Aufrufer awaiten + try/catch, analog zum
  `GamePlayerService`/`GameComponent`-Muster, das im Projekt bereits etabliert ist.
- Für `ngOnInit`s `onSnapshot`-Callback: den `error`-Callback von `onSnapshot(query, next,
  error)` nutzen (aktuell nicht übergeben — Firestore-Fehler im Snapshot-Listener verschwinden
  im Nichts) und ein sichtbares Fehlersignal (Signal, analog zu `GameComponent.loadError`)
  setzen.

---

### 6. Open/Closed-Verstoß: Jede neue Heldenfähigkeit erfordert neue if/switch-Zweige statt Polymorphie
**Priorität: nice-to-have (mittelfristig relevant, aktuell 11 Helden bereits hartcodiert)**

**Betroffene Dateien:**
- `heropower.component.ts:45-102` — zehn nahezu identische `heroPower<Name>()`-Methoden
  (`heroPowerGladiator`, `heroPowerBarbar`, `heroPowerZauberin`, `heroPowerMagier`,
  `heroPowerJaegerin`, `heroPowerWaldlaeufer`, `heroPowerDieb`, `heroPowerNinja`,
  `heroPowerPaladin`, `heroPowerWalkuere`) unterscheiden sich nur im geprüften
  `currentEnemy().type`-Wert (`'Person'`, `'Monster'`, `'Hindernis'` oder kein Check).
- `heropower.component.html:8-36` — zehn beinahe identische `@if (this.heroName() ==
  '<Name>')`-Blöcke, die jeweils ein anderes Icon binden und eine andere Methode aufrufen.
- `heropower-container.component.ts:52-72` — der bereits unter Befund 1 zitierte `switch
  (heroname)`.
- `src/models/helden/hero.class.ts` — die Basisklasse `Hero` trägt aktuell nur Stammdaten
  (`heroName`, `cardstack`, `heroPower`, `description`) und `toJSON()`, aber **keine**
  Verhaltens-Methode (kein `activatesOn(enemyType)`, kein `resolveHeropower(...)`). Die
  Heldentyp-Klassen unter `src/models/helden/*.class.ts` (barbar, dieb, gladiator, …) sind
  reine Datenklassen ohne eigene Fachlogik — die Fähigkeits-Unterschiede leben ausschließlich
  in den if/switch-Kaskaden der Komponenten, nicht in den Modellklassen, die dafür eigentlich
  prädestiniert wären.

**Problem:** Jede neue Heldenklasse erfordert Änderungen an mindestens drei Stellen (neue
`heroPower<Name>()`-Methode + neuer Template-`@if`-Block + neuer `switch`-Case in
`HeropowerContainerComponent`) statt einer neuen, in sich geschlossenen Implementierung. Das ist
ein klassischer Open/Closed-Verstoß: Die bestehenden Klassen müssen bei Erweiterung angefasst
werden, statt dass nur neuer Code hinzukommt. Die drei Aktivierungs-Varianten
(`heroPowerGladiator`/`Waldlaeufer`: nur bei `type === 'Person'`; `Barbar`/`Paladin`: nur bei
`'Monster'`; `Zauberin`/`Ninja`: nur bei `'Hindernis'`; `Jaegerin`/`Dieb`/`Walkuere`: immer)
reduzieren sich auf genau **drei Aktivierungsregeln plus "immer aktivierbar"** — mit einem
Strategy-Objekt pro Held ließe sich das auf eine Konfiguration statt zehn Methoden reduzieren.

**Vorschlag:**
- Ein `HeropowerStrategy`-Interface (`canActivate(enemy: Mob): boolean`,
  `resolve(context): void`) pro Heldenklasse, registriert in einer Lookup-Map
  (`Record<string, HeropowerStrategy>`), injiziert über einen neuen `HeropowerService`. Die
  Aktivierungsregel (`type === 'Person'` etc.) wandert als Property/Config in die jeweilige
  Heldenklasse unter `src/models/helden/`, statt in der Komponente dupliziert zu werden.
  `HeropowerComponent.activateHeroPower()`/`deactivateHeroPower()` bleiben unverändert, aber
  `heroPower<Name>()` verschwindet zugunsten einer einzigen generischen
  `onHeropowerIconClick()`-Methode, die die Strategie für `heroName()` nachschlägt.
- Im Template ersetzt eine einzige `@for`-Schleife über eine "Icon je nach Heldentyp"-Liste
  (oder ein Pipe `heroIconPath`) die zehn `@if`-Blöcke.
- `DiebServiceService` ist bereits ein Schritt in diese Richtung (Fachlogik pro Held in einem
  eigenen Service) — das Strategy-Pattern wäre die konsequente Verallgemeinerung auf alle
  Helden, statt für jeden weiteren Helden einen weiteren Einzel-Service oder weitere
  if/switch-Zweige zu ergänzen.

---

### 7. Konkrete Extraktionsvorschläge für `PlayerHandComponent` (Zusammenfassung)
**Priorität: wichtig (strukturelle Grundlage für 2/3/4/5/6)**

**Betroffene Datei:** `player-hand.component.ts` (622 Zeilen)

Vorschlag zur Aufteilung in vier neue Bausteine plus eine deutlich schlankere Komponente:

1. **`CardPlayService`** (Fachlogik: welche Karte passt auf welches Token) — übernimmt
   `chooseCard` (Z.315-380, aktuell die komplexeste Methode der Klasse: UI-Eingabe,
   Kartenregeln für Einzel-/Doppelkarten, Quest-Card-Platzhalter Z.326-328 und
   Heropower-Auswahl-Logik in einer Methode), `playCardfromHandAndUpdateEnemyToken`
   (Z.382-411), `playAsOneCard`/`playAsTwoCards` (Z.449-482), `checkForNextEnemy`/`getNextEnemy`/
   `getNextBoss` (Z.436-497). Nimmt Hand/Enemy/CardStack als Parameter, gibt die neuen Werte
   zurück oder dispatcht selbst — die Komponente ruft nur noch `cardPlay.chooseCard(card,
   {hand, enemy, ...})` auf.
2. **`HeropowerService`** (siehe Befund 6) — übernimmt `checkWalkuereHeropower`,
   `checkJaegerinHeropower`, `checkheropowerArray`, `checkDiebHeropower` (aktuell komplett
   auskommentiert, Z.543-590 — toter Code, der vermutlich durch `DiebServiceService` ersetzt
   wurde und entfernt werden kann), `executeWalkuereHeropower`, `executeJaegerinHeropower`,
   inkl. der unter Befund 3 beschriebenen gemeinsamen Nachzieh-Hilfsmethode.
3. **`FirestoreSyncService`** (siehe Befund 4) — kapselt `ngOnInit`s `onSnapshot`-Aufbau
   (Z.112-130) und die beiden `updateFromDatabase`/`updatePlayerFromDatabase`-Callbacks
   (Z.132-145) als Observable-Stream, den die Komponente abonniert.
4. **Sub-Komponenten fürs Template** — `player-hand.component.html` ist mit 17 Zeilen aktuell
   klein, aber `card-stack`- und `currentHandStack`-Blöcke (Z.1-14) liefern sich gut als eigene
   `CardStackComponent`/`PlayerHandCardsComponent` heraus, sobald Kartenanzeige-Transformationen
   (Befund 8) dazukommen — hält `PlayerHandComponent` als reinen Orchestrator schlank, analog
   zum bereits bestehenden Enemy-/Heropower-Container-Muster (`EnemyContainerComponent` +
   `EnemyComponent`, `HeropowerContainerComponent` + `HeropowerComponent`).

Nach der Extraktion bliebe in `PlayerHandComponent` im Wesentlichen: Signal-Deklarationen,
`ngOnInit`/`ngOnDestroy`, und dünne Wrapper-Methoden, die Events aus dem Template an die
injizierten Services weiterreichen — deutlich unter 622 Zeilen, vermutlich < 150.

---

### 8. Performance: Wiederholte Berechnungen und Aufrufe im Template statt Pipes/computed Signals
**Priorität: nice-to-have**

**Betroffene Dateien:**
- `heropower.component.html:8-36` — jeder der zehn `@if`-Blöcke ruft `this.heroName()` erneut
  auf (zehnmal pro Change-Detection-Zyklus dasselbe Signal gelesen); funktional unkritisch, da
  Signal-Reads billig sind, aber ein `@switch (heroName())`-Block statt zehn `@if`s wäre sowohl
  lesbarer als auch das idiomatische Pendant zu Befund 6 (Strategy-Lookup ersetzt Kaskade auch
  im Template).
- `heropower.component.html:3` — `[ngClass]="{'color-effect': this.heropowerActivated()}"`
  verwendet noch explizites `this.` im Template (unüblich/unnötig bei Signal-Aufrufen, rein
  stilistisch, kein Bug).
- Kein `trackBy`-Problem: Die vorhandenen `@for`-Schleifen (`player-hand.component.html:3`,
  `:10`; `enemy.component.html:4`) nutzen bereits `track card`/`track token`/`track c` — das
  eingebaute Control-Flow-`@for` erzwingt `track` syntaktisch, insofern ist das im Unterschied
  zu klassischem `*ngFor` hier strukturell bereits abgedeckt. Zu prüfen bleibt aber
  `player-hand.component.html:10`: `track card` verwendet den Kartennamen (String) als Identity
  — bei zwei identischen Karten in der Hand (z. B. zwei Bärentatzen) kollidiert der Track-Key,
  Angular kann die beiden `<img>`-Elemente dann nicht mehr stabil unterscheiden (Reordering-
  Artefakte beim Nachziehen sind denkbar). Ein Index-basierter oder zusammengesetzter Key
  (`card + '_' + $index`) wäre robuster, sobald doppelte Karten im Deck vorkommen (im
  Kartenmodell nicht ausgeschlossen).
- **Kein dediziertes Pipe für Karten-/Icon-Pfade vorhanden**: `src="./assets/img/cards/{{card}}.png"`
  (`player-hand.component.html:12`) und die zehn hartcodierten Icon-Pfade in
  `heropower.component.html` sind String-Interpolationen direkt im Template. Ein
  `cardImagePath`-Pipe (`{{ card | cardImage }}`) würde die Pfad-Konvention
  (`./assets/img/cards/`, Dateiendung) zentralisieren — aktuell an mehreren Stellen im Projekt
  (auch `enemy.component.html:4`: `./assets/img/monsterToken/{{token}}.png`) wortgleich
  dupliziert.

---

### 9. `GameComponent`/`AppComponent` — deutlich saubereres Gegenbeispiel, ein kleiner Rest-Befund
**Priorität: nice-to-have**

**Betroffene Datei:** `game.component.ts`

**Beobachtung (positiv, zum Vergleich):** `GameComponent` ist mit 129 Zeilen und komplett über
`GamePlayerService` ausgelagertem Firestore-Zugriff bereits nah am Zielbild aus Befund 2/7 —
`checkIfPlayerIsAlreadyPartOfGame()` (Z.56-71) und `openDialog()` (Z.99-118) demonstrieren das
Muster "await Service-Call in try/catch, dann dispatch", das `PlayerHandComponent` fehlt.
Einziger kleiner Punkt: `currentHero: Object = {}` (Z.43) nutzt den generischen `Object`-Typ
statt eines konkreten Interface (z. B. `Herointerface` aus `src/models/helden/hero.class.ts`,
das bereits existiert) — `this.currentHero` wird zudem nirgends gelesen, nur in
`openDialog()`s `data: { choosenHero: this.currentHero }` als (stets leeres) Ausgangsobjekt an
den Dialog übergeben; totes/nutzloses Feld, kein funktionaler Schaden, aber unnötige Verwirrung.
`AppComponent` (`app.component.ts:20-22`) hat ein leeres `ngOnInit(): void {}` — kann ersatzlos
entfallen (`implements OnInit` mitentfernen), macht aber keinen praktischen Unterschied.

## Priorisierte Empfehlungen

1. **Kritisch — sofort:** Befund 1 beheben (tote Heropower-Stub-Methoden in
   `HeropowerContainerComponent` entfernen und echte Logik verdrahten). Das ist kein
   Stil-Thema, sondern ein Funktionsfehler: Für 8 von 10 Helden hat die Heropower im Spiel
   aktuell keine Wirkung.
2. **Wichtig — nächster Refactoring-Schritt (analog zum OnPush-Plan, in kleinen Schritten):**
   Befund 7 (Extraktion `CardPlayService`/`HeropowerService`/`FirestoreSyncService` aus
   `PlayerHandComponent`) — löst dabei automatisch Befund 2, 3 und 4 mit. Reihenfolge:
   erst `FirestoreSyncService` (kleinster Schnitt, entkoppelt Datenzugriff), dann
   `HeropowerService` (klärt gleichzeitig Befund 1 sauber), zuletzt `CardPlayService`.
3. **Wichtig:** Befund 5 (Error-Handling für `SaveGameService`/Firestore-Reads in
   `PlayerHandComponent`) — unabhängig von der Extraktion umsetzbar, sollte aber im Zuge von
   Punkt 2 gleich mit in die neuen Services wandern statt zusätzlich in die alte Komponente.
4. **Nice-to-have, aber lohnend bei weiterem Helden-Zuwachs:** Befund 6 (Strategy-Pattern für
   Heropowers) — reduziert Open/Closed-Schulden, bevor ein elfter/zwölfter Held dazukommt.
5. **Nice-to-have:** Befund 8 (Template-Pipes, `track`-Key-Robustheit bei doppelten Karten),
   Befund 9 (kleine Aufräumpunkte in `GameComponent`/`AppComponent`).
