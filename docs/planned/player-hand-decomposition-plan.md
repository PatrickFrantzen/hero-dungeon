# Refactoring-Plan: `PlayerHandComponent` entflechten

## Status (2026-08-29)

TODO 1-3 umgesetzt, jeweils build-/testgrün, in eigenen Commits: `FirestoreSyncService`
(inkl. `onSnapshot`-Error-Callback und `loadError`-Signal — zusammen mit TODO 5 aus
`docs/planned/firestore-repository-service-plan.md` in derselben Session, wie dort
vorgesehen), `HeropowerService` (Walküre/Jägerin/"Array"-Gruppe, bewusst **nicht** zu einer
gemeinsamen Hilfsmethode vereinheitlicht — Diagnose ergab einen weiteren, in diesem Plan nicht
dokumentierten Verhaltensunterschied zwischen `checkheropowerArray` und den beiden anderen
Dispatch-Timings, siehe Status in `heropower.service.ts`), `CardPlayService` (komplette
Karten-/Encounter-Regeln, `chooseCard()` einziger öffentlicher Einstiegspunkt). Ergebnis:
`PlayerHandComponent` von ~586 auf 171 Zeilen reduziert.

TODO 4 (Sub-Komponenten fürs Template) und TODO 5 (Heropower-Strategy-Pattern) bleiben offen —
beide sind im Plan selbst als optional/nice-to-have markiert, TODO 5 setzt zusätzlich auf
`docs/done/hero-data-model-plan.md` auf, das seit dieser Session verfügbar ist, falls eine
künftige Session das aufgreifen will.

## Status (2026-09-05)

**TODO 4 (Teil 1) umgesetzt**: `HandCardsComponent` (`player-hand/hand-cards/`) übernimmt das
Fächer-Layout (`handCardStyles()`/`handCardStyle()`) und die Swipe-Geste (`onCardTouch*()`)
inkl. des zugehörigen Handkarten-Renderings (Bild + Rasten-Button) — reiner Presenter
(`hand = input.required<string[]>()`, `singleplayer = input.required<boolean>()`,
`cardChosen`/`cardRested` als `output<string>()`), kein Store-/Firestore-Zugriff.
`PlayerHandComponent` bleibt für `vibrate()`/`reportWriteFailure()`/`chooseCard()`/`restCard()`
zuständig und reicht `currentHand()`/`isSingleplayer()` nur noch als Inputs durch. Damit auf
~320 Zeilen reduziert (vorher 444). `CardStackComponent`/`PlayerHandCardsComponent` für den
verbleibenden Rest des Templates (Kartenstapel-Zähler, Event-Button, Fehleranzeige) bewusst
nicht mit ausgelagert — dieser Rest ist bereits ohne eigene Business-Logik und eng an
`PlayerHandComponent`s eigene Signale gekoppelt, eine weitere Aufspaltung hätte hier keine echte
Vertiefung gebracht, nur zusätzliche Indirektion.

`ng build`/`ng test --watch=false --browsers=ChromeHeadlessCI` grün (175/175) nach dem Schritt.
**Kein manueller Multiplayer-Smoke-Test durchgeführt** (weiterhin kein Firebase-Emulator-/
Zwei-Browser-Setup in dieser Session verfügbar) — vor dem Merge nachholen (Karte per Tap **und**
Swipe spielen, Rasten-Button im Singleplayer, Fächer-Layout bei 6+ Handkarten).

TODO 5 bleibt offen, als nächster Kandidat vorgesehen — Diagnose/Vorgehen unten am selben Tag
überarbeitet (Datenfelder auf `HeroDefinition` statt einer neuen `HeropowerStrategy`-
Klassenhierarchie, deckt zusätzlich ein zweites, bisher nicht im Plan erfasstes Duplikat in
`HeropowerContainerComponent` mit ab), noch nicht implementiert.

`ng build`/`ng test --watch=false --browsers=ChromeHeadlessCI` grün nach jedem Schritt.
**Kein manueller Multiplayer-Smoke-Test durchgeführt** (kein laufendes Firebase-
Emulator-/Zwei-Browser-Setup in dieser Session verfügbar) — der Plan verlangt diesen
ausdrücklich vor jedem Merge; vor dem tatsächlichen Merge nachholen (Karte spielen, jede
Heropower-Variante auslösen, zweiter Spieler tritt bei, Kartenstapel geht zur Neige).

Kontext: Punkt 5 der „Empfohlenen Reihenfolge" aus
`docs/done/review-2026-08/00-overview.md`, Detailbefunde 2/3/4/5/6/7 in
`docs/done/review-2026-08/03-components-game.md`. Der bereits abgeschlossene OnPush-Umbau
(`docs/done/onpush-refactor-plan.md`) hat diese Komponente explizit als „eigenständiges
größeres Vorhaben" ausgeklammert — dieses Dokument ist dieses Vorhaben. Größter Einzelbrocken
aus dem gesamten Review; **in mehreren kleinen PRs abarbeiten**, nicht in einem Rutsch. Stand
der Diagnose: 2026-08-29, nach PR #21 (in PR #21 wurde hier nur toter Code entfernt — die
strukturelle Vermischung selbst ist unverändert).

## Diagnose

`src/app/components/player-hand/player-hand.component.ts` (586 Zeilen, ~20 Methoden) vereint
vier Verantwortlichkeiten in einer Klasse:

1. **Firestore-Subscriptions/-Reads**: `ngOnInit()` (`:111-129`, `onSnapshot`/`getDoc`/`query`
   direkt auf `this.db = getFirestore()`, `:92`), `getAllPlayerDatatoGivePlayersCards()`
   (`:195-205`), `getOtherPlayerDataTogivePlayerCards()` (`:232-243`).
2. **Firestore-Writes über `SaveGameService`**: in praktisch jeder Methode ab `:175`
   (`saveGame.updateHandstack`/`updateCardstack`/`updateCurrentEnemyToken`/`updateNewMob`),
   keine dieser Aufrufe wird awaited oder auf Fehler geprüft.
3. **Spielregeln**: `chooseCard()` (`:327-392`, die komplexeste Methode — welche Karte passt
   auf welches Token, Einzel-/Doppelkarten-Logik, Heropower-Auswahl in derselben Methode),
   `checkForNextEnemy()`/`getNextEnemy()`/`getNextBoss()` (`:448-509`), `checkHandsize()`
   (`:425-446`).
4. **NGXS-State-Dispatch**: `store.dispatch(...)` über die ganze Datei verteilt (>20
   Aufrufe).

**Massive Duplikation zwischen den drei Heropower-Check-Methoden** (aufgerufen aus
`onHeropowerResolved()`, `:146-158`, das `HeropowerContainerComponent`s `heropowerResolved`-
Output entgegennimmt — dieser Teil der Verdrahtung ist bereits korrekt, siehe Status in
`docs/done/review-2026-08/03-components-game.md`):
- `checkWalkuereHeropower()` (`:160-193`) und `checkJaegerinHeropower()` (`:294-325`) sind zu
  ~90% identischer Code (derselbe „Karte aus Hand entfernen, bei Platz nachziehen"-Block,
  inkl. verwirrendem inneren Variablen-Shadowing `let currHand`/`let currCardStack` — die
  äußere Deklaration wird sofort überschrieben, funktional kein Bug, aber irreführend beim
  Lesen); nur der Aufruf am Ende unterscheidet sich
  (`getAllPlayerDatatoGivePlayersCards()` vs. `openDialog()`).
- `checkheropowerArray()` (`:513-553`) enthält denselben inneren Nachzieh-Block ein drittes
  Mal, vorangestellt mit dem „Gegner-Token leeren"-Teil, der auch in `playAsOneCard()`
  (`:461-470`), `playAsTwoCards()` (`:472-494`) und `chooseCard()` selbst wiederkehrt.
- `checkHandsize()` (`:425-446`) implementiert bereits sauber „vom Stack nachziehen bis Hand
  voll oder Stack leer" — wird aber an den drei Heropower-Stellen nicht wiederverwendet,
  sondern erneut copy-paste dupliziert.
- `executeWalkuereHeropower()` (`:207-230`) und `executeJaegerinHeropower()` (`:245-292`) sind
  ebenfalls redundant: dieselbe „N-mal vom Stack nachziehen, dabei Firestore direkt
  beschreiben"-Schleife, nur die Anzahl der Wiederholungen (2 vs. 4) und ob zusätzlich
  `store.dispatch(...)` passiert (nur im `this.currentPlayerId() === userId`-Zweig von
  `executeJaegerinHeropower`, `:251-269`) unterscheiden sich. `executeWalkuereHeropower()`
  dispatcht **nie** in den Store, weil dort immer ein *anderer* Spieler betroffen ist, dessen
  eigene `onSnapshot`-Subscription (`ngOnInit`, `:111-129`, dort läuft der Handstack-Sync für
  den lokal eingeloggten Spieler) den State bei ihm selbst aktualisiert — dieser
  Verhaltensunterschied ist beabsichtigt und muss beim Zusammenführen erhalten bleiben, nicht
  versehentlich vereinheitlicht werden.

**Duplizierte Firestore-Boilerplate** (`query`+`collection`+`where`, teils `onSnapshot`, teils
`getDocs`): `ngOnInit()` (`:117-121`), `getAllPlayerDatatoGivePlayersCards()` (`:196-200`),
`getOtherPlayerDataTogivePlayerCards()` (`:233-238`) — dieselbe Pfad-Konstruktion
`games/{gameId}/player` wie in den Services (siehe
`docs/planned/firestore-repository-service-plan.md`).

**Kein Error-Handling**: kein `try/catch` um `getDoc`/`getDocs`/`onSnapshot` in dieser Datei
(anders als `GameComponent.checkIfPlayerIsAlreadyPartOfGame()`, das bereits sauber
`try/catch` mit einem `loadError`-Signal nutzt — das Zielmuster existiert im Projekt schon).

**Open/Closed-Verstoß in `heropower.component.ts`** (Befund 6, nice-to-have/mittelfristig,
hier als Stretch-Goal aufgenommen): zehn nahezu identische `heroPower<Name>()`-Methoden
(`heropower.component.ts:45-102`), die sich nur im geprüften `currentEnemy().type`-Wert
unterscheiden (`'Person'`, `'Monster'`, `'Hindernis'` oder immer aktivierbar). Der zugehörige
`switch (heroname)` in `HeropowerContainerComponent` (`heropower-container.component.ts:57-77`)
hat dasselbe Muster.

## TODOs

Reihenfolge wie im Review empfohlen: erst `FirestoreSyncService` (kleinster, am besten
isolierter Schnitt), dann `HeropowerService` (klärt die Heropower-Duplikate strukturell),
zuletzt `CardPlayService` (größter Umbau, an dem sich die Karten-/Encounter-Regeln
konzentrieren).

- [ ] **TODO 1 — `FirestoreSyncService` extrahieren**
  - Kapselt `ngOnInit()`s `onSnapshot`-Aufbau (`:111-129`) und die beiden
    `updateFromDatabase()`/`updatePlayerFromDatabase()`-Callbacks (`:131-144`) als
    `Observable<Game>`/`Observable<PlayerDoc>`-Streams statt roher `DocumentData`.
  - `PlayerHandComponent.ngOnInit()` reduziert sich auf Abonnieren + Dispatchen (Zielbild:
    `GameComponent`, das dieses Muster bereits mit `GamePlayerService` vorlebt).
  - Sinnvoll direkt mit TODO 5 aus `docs/planned/firestore-repository-service-plan.md`
    zusammenzulegen (Error-Callback für `onSnapshot`, sichtbares Fehler-Signal) — beide Pläne
    fassen dieselben Zeilen an, nacheinander in einer Session abarbeiten.
  - Verifikation: `ng build`, `ng test`, manueller Test „Spiel laden, Handkarten/Gegner
    erscheinen korrekt" (reiner Read-Pfad, geringes Risiko).

- [ ] **TODO 2 — `HeropowerService` extrahieren**
  - Übernimmt `checkWalkuereHeropower`, `checkJaegerinHeropower`, `checkheropowerArray`,
    `executeWalkuereHeropower`, `executeJaegerinHeropower`,
    `getAllPlayerDatatoGivePlayersCards`, `getOtherPlayerDataTogivePlayerCards`.
  - Zentrale, gemeinsame Hilfsmethode für „Karte aus Hand entfernen, bei Platz aus dem Stack
    nachziehen" — nutzt intern das bereits vorhandene `checkHandsize()`-Muster statt es ein
    viertes Mal zu duplizieren.
  - **Verhaltensunterschied bewusst erhalten**: `executeWalkuereHeropower` dispatcht nicht in
    den Store (anderer Spieler, eigene Subscription aktualisiert dessen State), `
    executeJaegerinHeropower` dispatcht nur im Zweig „ich selbst bin betroffen" — beim
    Zusammenführen der beiden Methoden diesen Unterschied als expliziten Parameter/Zweig
    abbilden, nicht stillschweigend vereinheitlichen (siehe Diagnose).
  - `HeropowerContainerComponent.heropowerResolved`-Output (`heropower-container.component.ts:47`)
    bleibt der Trigger-Mechanismus; `PlayerHandComponent.onHeropowerResolved()` ruft künftig
    `heropowerService.resolve(kind, ...)` statt der lokalen Methoden.
  - Verifikation: `ng build`, `ng test`, manueller Test je Heldentyp mit Heropower (Walküre,
    Jägerin, „Array"-Gruppe — Gladiator/Barbar/Zauberin/Waldläufer/Ninja/Paladin — und Dieb über
    `DiebService`, der unverändert bleibt) — dieser Umbau berührt aktive Spiellogik, die
    aktuelle Test-Suite deckt nur „should create" ab.

- [ ] **TODO 3 — `CardPlayService` extrahieren**
  - Übernimmt `chooseCard` (`:327-392`), `playCardfromHandAndUpdateEnemyToken` (`:394-423`),
    `playAsOneCard`/`playAsTwoCards` (`:461-494`), `checkForNextEnemy`/`getNextEnemy`/
    `getNextBoss` (`:448-509`), `checkHandsize` (`:425-446`), `saveHand` (`:556-567`).
  - Nimmt Hand/Enemy/CardStack als Parameter, gibt neue Werte zurück oder dispatcht selbst —
    `PlayerHandComponent` ruft nur noch `cardPlay.chooseCard(card, {...})` auf.
  - `loadNextDungeon()` (`:511`, leerer Methodenstumpf, nirgends im aktuellen Spielfluss
    erreicht — `checkForNextEnemy` hat den zugehörigen Aufruf bereits auskommentiert,
    `:449-452`) entweder hier mit umsetzen oder als bewusst offener TODO-Kommentar migrieren,
    nicht stillschweigend fallen lassen.
  - Verifikation: `ng build`, `ng test`, manueller Test „Karte spielen (Einzel- und
    Doppelkarte), Gegner besiegen, nächster Gegner/Boss lädt" — der Kernspielloop.

- [x] **TODO 4 — Sub-Komponenten fürs Template (optional, nach TODO 1-3)** — Fächer-/Swipe-Teil
  am 2026-09-05 als `HandCardsComponent` umgesetzt, siehe Status-Abschnitt oben. Der
  ursprünglich vorgeschlagene `CardStackComponent`-Schnitt (Kartenstapel-Zähler) wurde bewusst
  nicht umgesetzt, siehe Begründung dort.
  - ~~`player-hand.component.html` in `CardStackComponent`/`PlayerHandCardsComponent`
    aufteilen, analog zum bestehenden `EnemyContainerComponent`/`HeropowerContainerComponent`-
    Muster. Erst sinnvoll, wenn TODO 1-3 die Komponente bereits auf reine Orchestrierung
    reduziert haben.~~
  - Verifikation: `ng build`, `ng test` — grün, siehe Status-Abschnitt oben.

- [ ] **TODO 5 — Heropower-Aktivierungs-/Auflösungsregeln datengetrieben statt zwei
  duplizierten `switch`/Methoden-Sets** (überarbeitete Diagnose 2026-09-05, ersetzt die
  ursprüngliche "Strategy-Pattern"-Idee unten)
  - **Befund**: zwei separate, aber strukturell gleiche Duplikate über je 10 Helden:
    1. `heropower.component.ts:77-136` — zehn `heroPower<Name>()`-Methoden, die sich nur im
       geprüften `currentEnemy().type`-Wert unterscheiden (`'Person'`/`'Monster'`/
       `'Hindernis'`/immer aktivierbar).
    2. `heropower-container.component.ts:60-81` — ein zweiter `switch (heroname)`, der
       entscheidet, welches Auflösungs-Ereignis (`'array'`/`'magier'`/`'jaegerin'`/`'walkuere'`/
       Dieb-Direktaufruf) ein Held auslöst.
    Beide Achsen sind unabhängig voneinander (wann aktivierbar vs. wie aufgelöst) — ein
    einzelnes `HeropowerStrategy.canActivate()`-Interface (ursprüngliche Idee unten) hätte nur
    Duplikat 1 gelöst und Duplikat 2 unangetastet gelassen. Beide werden jetzt gemeinsam
    angegangen, damit keine der beiden Stellen dupliziert zurückbleibt.
  - **Lösung — Datenfelder statt Klassenhierarchie**: seit
    `docs/done/hero-data-model-plan.md` gibt es `HERO_DEFINITIONS`/`HeroDefinition`
    (`src/models/helden/hero-definitions.ts`) als einzige Heldenquelle, bereits
    konfigurationsbasiert (kein Klassen-pro-Held-Muster mehr, siehe `EXTRA_DECK_FOR_HERO` als
    Vorbild für ein weiteres Lookup-Feld). `HeropowerStrategy` als neue Klassenhierarchie wäre
    ein Rückschritt gegen dieses bereits etablierte Muster — stattdessen zwei rein deklarative
    Felder auf `HeroDefinition`:
    ```ts
    activatesOn: 'Person' | 'Monster' | 'Hindernis' | 'always';
    resolutionKind: 'array' | 'magier' | 'jaegerin' | 'walkuere' | 'dieb';
    ```
    Beide Felder leben ausschließlich auf `HeroDefinition` (statischer Fakt pro Held, kein
    Laufzeitzustand) — Komponenten schlagen per `HERO_DEFINITIONS.find(...)` nach, analog zu
    `EXTRA_DECK_FOR_HERO`.
  - `heropower.component.ts`: die zehn `heroPower<Name>()`-Methoden + `heroPowerHandlers`-
    Lookup entfallen, ein einziges `onActivateHeropower()` liest `activatesOn` (per
    Helden-Lookup über `heroName()`) und toggelt `activateHeroPower()`/`deactivateHeroPower()`
    (`'always'` verhält sich wie die bisherigen Magier/Jägerin/Dieb/Walküre-Methoden ohne
    Typ-Check).
  - `HeropowerContainerComponent`: der `switch (heroname)` wird ein `resolutionKind`-Lookup;
    `resolutionKind === 'dieb'` bleibt als eigener Zweig (`DiebService.heropower(...)` statt
    `heropowerResolved.emit(...)`, da Dieb nie über dieses Output läuft).
  - Template `heropower.component.html`: zehn `@if`-Blöcke durch eine `@for`-Schleife über
    eine „Icon je Heldentyp"-Liste ersetzen (unverändert zur ursprünglichen Idee, hängt an
    keinem der beiden Felder oben).
  - Dieses TODO ist bewusst optional/nice-to-have (Befund 6 ist im Review als „mittelfristig
    relevant" eingestuft, nicht kritisch) — bei Zeitdruck nach TODO 1-4 abbrechen und diesen
    Punkt für eine weitere Session zurückstellen.
  - Verifikation: `ng build`, `ng test`, manueller Test je Heldentyp (wie TODO 2).

## Verifikation (gesamter Plan)

- `ng build` und `ng test --watch=false --browsers=ChromeHeadlessCI` nach jedem TODO grün.
- **Manueller Smoke-Test vor jedem Merge zwingend**: die aktuelle Test-Suite deckt für diese
  Datei ausschließlich „should create" ab, nicht das tatsächliche Spielverhalten. Mindestens
  zwei Browser-Tabs gegen ein echtes Spiel (oder den Firestore-Emulator): Karte ausspielen,
  jede Heropower-Variante auslösen, zweiter Spieler tritt bei, Kartenstapel geht zur Neige.

## Nicht im Scope

- `FirestoreRepositoryService`-Einführung selbst (paralleler Plan,
  `docs/planned/firestore-repository-service-plan.md`) — dieser Plan nutzt, was dort entsteht,
  führt es aber nicht selbst ein. Reihenfolge zwischen beiden Plänen ist nicht zwingend fest,
  aber TODO 1 hier und TODO 5 dort überschneiden sich in `ngOnInit()` — in einer Session
  abarbeiten, nicht parallel in zwei Sessions am selben Code.
- Datengetriebenes Heldenmodell (`docs/planned/hero-data-model-plan.md`) — TODO 5 hier setzt
  darauf auf, ist aber unabhängig durchführbar (mit etwas mehr Duplikation, falls zuerst
  umgesetzt).

## Referenzen

- `docs/done/review-2026-08/03-components-game.md` — vollständige Befundliste (Befund 1 war
  bereits vor dem Review behoben; Befund 2/3/4/5/6/7 sind hier relevant).
- `docs/done/onpush-refactor-plan.md` — Referenzstil, plus die dort bereits gelöste Dual-
  Write-Problematik in genau diesen beiden Firestore-Callbacks.
- `src/app/services/game-player.service.ts` + `src/app/components/game/game.component.ts` —
  bestehendes Zielbild „Firestore-Zugriff im Service, Komponente orchestriert nur noch".
