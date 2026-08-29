# Refactoring-Plan: PlayerHandComponent/GameComponent/AppComponent auf OnPush

Kontext: Issue #6 hat `ChangeDetectionStrategy.OnPush` auf 10 von 13 Komponenten gesetzt
(PR #17). `PlayerHandComponent`, sein Elternteil `GameComponent` und dessen Host
`AppComponent` blieben bewusst auf `Default` — Begründung und Analyse unten. Dieses Dokument
ist der Umsetzungsplan dafür, aus einer neuen Session heraus abgearbeitet zu werden, im
gleichen Stil wie die vorherigen Issues (eigener Branch pro Schritt, PR, Tests, Merge).

## Diagnose

`GameComponent` und `AppComponent` sind selbst bereits vollständig signal-basiert — kein
Problem für sich genommen. Sie sind nur deshalb nicht auf OnPush, weil `GameComponent`
`PlayerHandComponent` als Kind rendert und `AppComponent` über den `router-outlet`
`GameComponent` hostet: Ein OnPush-Vorfahre, der nicht selbst "dirty" markiert wird,
unterbindet die Traversierung zu einem Default-Kind. Sobald `PlayerHandComponent` sauber ist,
können alle drei kaskadierend auf OnPush (Angulars Signal-Change-Detection markiert bei
Signal-Änderungen gezielt den Pfad bis zur Wurzel, unabhängig von der Strategie
dazwischenliegender Komponenten — das gilt aber nur für Signals, nicht für rohe
`.subscribe()`-Mutationen).

**Der eigentliche Fund in `PlayerHandComponent`** (`src/app/components/player-hand/player-hand.component.ts`):
In `updateFromDatabase()` und `updatePlayerFromDatabase()` (den beiden Firestore-`onSnapshot`-
Callbacks) wird für fast jedes Feld doppelt geschrieben — einmal direkt
(`this.currentEnemy = data['currentEnemy']`) und einmal per NGXS-Dispatch
(`store.dispatch(new SetNewEnemy(...))`). Geprüft: Für `currentHand`, `currentCardStack`,
`currentDeliveryStack`, `currentEnemy`, `currentMob`, `currentBoss`, `questCardStatus`
dispatcht der Code bereits die passende Action, die genau denselben State-Slice setzt, den der
zugehörige `@Select()` liest. **Die direkte Feldzuweisung ist in diesen sieben Fällen
komplett redundant** — der Store-Wert kommt über die Subscription ohnehin synchron nach.

Ausnahme: `this.currentPlayers = data['choosenHeros']` in `updateFromDatabase()` hat **keinen**
korrespondierenden Dispatch. Der Store bekommt neue Mitspieler aktuell nur über
`updateChoosenHeros` (hängt einen einzelnen Spieler an), nicht über den vollständigen
Firestore-Snapshot. Dafür braucht es eine neue Action (siehe TODO 1).

## TODOs

- [ ] **TODO 1 — Neue Action `SetChoosenHeros`**
  - `src/app/actions/currentGame-action.ts`: neue Action-Klasse, die `choosenHeros: {playerName, playerId, playerHero}[]` trägt.
  - `src/app/states/currentGame-state.ts`: Reducer, der `state.game.choosenHeros` komplett
    ersetzt (analog zum bestehenden `updateQuestCardActivated`-Reducer, der auch nur ein
    einzelnes Feld von `state.game` per `patchState` überschreibt).
  - Verifikation: `ng build`, bestehende Suite grün (kein neues Verhalten, nur eine neue
    Action, die noch nirgends aufgerufen wird).

- [ ] **TODO 2 — Dual-Write in `updateFromDatabase`/`updatePlayerFromDatabase` auflösen**
  - Direkte Feldzuweisungen (`this.currentEnemy = ...`, `this.currentBoss = ...`,
    `this.currentMob = ...`, `this.currentPlayers = ...`, `this.questCardStatus = ...`,
    `this.currentCardStack = ...`, `this.currentHand = ...`, `this.currentDeliveryStack = ...`)
    entfernen, nur noch dispatchen — inkl. neuem `SetChoosenHeros`-Dispatch für
    `currentPlayers` (aus TODO 1).
  - Verhalten bleibt identisch, weil der Store danach exakt denselben Wert liefert wie vorher
    die direkte Zuweisung.
  - Verifikation: `ng build`, `ng test` (mehrfach wiederholt wie bei den vorherigen Issues,
    um Flakes auszuschließen).

- [ ] **TODO 3 — Restliche `@Select()`-Felder auf `store.selectSignal()` umstellen**
  - Betroffen: `currentPlayers$`, `currentHand$`, `currentCardStack$`, `currentEnemy$`,
    `currentMob$`, `currentBoss$`, `currentDeliveryStack$`, `questStatus$`.
  - Gleiches Muster wie in Issue #4 (PR #15) bereits für andere Komponenten gemacht.
  - `getGameData()`, alle `*Subscription`-Felder und der zugehörige Teil von `ngOnDestroy()`
    entfallen (nur `gameSubscr` bleibt — das ist die rohe Firestore-`collectionData()`-
    Subscription, keine `@Select()`).
  - Verifikation: `ng build`, `ng test`.

- [ ] **TODO 4 — Alle internen Lesezugriffe umstellen**
  - `this.currentHand` → `this.currentHand()` usw., durchgängig in allen Methoden
    (`chooseCard`, `checkHandsize`, `checkWalkuereHeropower`, `checkJaegerinHeropower`,
    `executeJaegerinHeropower`, `checkheropowerArray`, `saveHand`, `playCardfromHandAndUpdateEnemyToken`,
    `playAsOneCard`, `playAsTwoCards`, `getNextEnemy`, `getNextBoss`, `checkForNextEnemy`, ...).
  - Rein mechanisch, aber die Datei ist groß (~500 Zeilen) — sorgfältig durchgehen, nicht per
    blindem Suchen-Ersetzen (Kommentare wie in `checkDiebHeropower()` enthalten bereits
    auskommentierten Code mit alten Feldnamen, der nicht mit umgeschrieben werden muss).
  - Verifikation: `ng build` (TypeScript deckt hier die meisten Stellen ab, die vergessen
    wurden — ein Signal ohne `()` aufgerufen ergibt einen Typfehler).

- [ ] **TODO 5 — `ChangeDetectionStrategy.OnPush` setzen**
  - Reihenfolge: `PlayerHandComponent` → `GameComponent` → `AppComponent`.
  - Die erklärenden Kommentare ("Not OnPush: ...") in `game.component.ts` und
    `app.component.ts` (aus PR #17/#18) entfernen bzw. durch einen kurzen Hinweis ersetzen,
    dass die Abhängigkeit aufgelöst wurde.

- [ ] **TODO 6 — Verifikation**
  - `ng build` + `ng test` (mehrfach wiederholt), `npm run test:rules` (sollte unberührt sein).
  - **Manueller Smoke-Test empfohlen, bevor gemerged wird**: Zwei Browser-Tabs gegen ein
    echtes Spiel (oder den Firestore-Emulator), Karte ausspielen, Heropower auslösen, zweiter
    Spieler tritt bei — hier wird echte, ungetestete Spiellogik angefasst, die aktuelle
    Test-Suite deckt nur "should create" ab, nicht das tatsächliche Spielverhalten.

## Nicht im Scope dieses Plans

Die generelle Vermischung von Firestore-Zugriff, Geschäftslogik und UI in
`PlayerHandComponent` (>500 Zeilen, viele Verantwortlichkeiten) bleibt bestehen — das wäre ein
eigenes, größeres Refactoring (Firestore-Zugriff in einen Service auslagern, analog zu
`GamePlayerService` aus Issue #8), unabhängig von der OnPush-Frage.

## Referenzen

- PR #15 (Issue #4): Muster für `@Select()` → `store.selectSignal()`
- PR #17 (Issue #6): OnPush-Einführung, dokumentiert genau diese drei Ausnahmen
- PR #18 (Issue #8): `GamePlayerService`-Extraktion als Vorbild für ein mögliches
  Folge-Refactoring von `PlayerHandComponent`
