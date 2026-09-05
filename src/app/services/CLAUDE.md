# src/app/services/ — Firestore-Zugriff & Business-Logik

Kein separater Repository-Layer im architektonischen Sinn, aber seit
`docs/done/firestore-repository-service-plan.md` auch kein wildes `doc()`/`getDoc()`/
`updateDoc()` mehr direkt in Komponenten verstreut — die Firestore-Zugriffe sind in den
Repository-Services unten gebündelt.

**Dependency Injection: `inject()`** (Issue #94) — alle Services in diesem Ordner injizieren
ihre Abhängigkeiten per Klassenfeld (`private repo = inject(FirestoreRepositoryService);`) statt
über den Constructor, siehe Root-`CLAUDE.md`. `AuthFormService`/`PlayerRepositoryService`/
`GameRepositoryService`/`LocalGameDocumentStoreService`/`DiebService` wurden dafür umgestellt;
`FirestoreRepositoryService`/`FirestoreSyncService` nutzten bereits vorher `inject()`.

## Repository-Services (Firestore-Zugriff)

- **`firestore-repository.service.ts`** — Basis: `FirestoreOperationError` (typisierter Fehler
  mit Operation + Pfad) und DI-injiziertes `Firestore`. Andere Repository-Services bauen darauf
  auf statt jeweils eigene Fehlerbehandlung zu erfinden. **Einziger Umschaltpunkt lokal/
  Firestore (Issue #73):** `getDoc()`/`setDoc()`/`updateFields()`/`queryAll()`/`queryLatest()`
  prüfen zuerst, ob `path[1]` (die gameId) laut `local-game-id.util.ts` (`isLocalGameId()`,
  Präfix `local-`) ein lokaler Singleplayer-Spielstand ist — falls ja, wird komplett ohne
  Firestore-Zugriff an `LocalGameDocumentStoreService` delegiert. Da `GameRepositoryService`/
  `PlayerRepositoryService` ausnahmslos über diese Basismethoden gehen, brauchen **keine** ihrer
  ~21 spezifischen Methoden (`updateCurrentEnemyToken()`, `updatePlayerCards()`, usw.) eine
  eigene lokal/Firestore-Fallunterscheidung. **`CardPlayService`/`HeropowerService` sind die
  Ausnahme** — sie rufen `queryAll()` an ein paar Stellen direkt auf `FirestoreRepositoryService`
  auf (statt über `GameRepositoryService`/`PlayerRepositoryService`, die keine Query-Methoden
  anbieten), für "alle Spieler des Spiels" (`reshuffleAllPlayersForNewDungeon()`) bzw. "alle
  anderen Spieler" (`applyEventToOtherPlayers()`, `drawCardsForOtherPlayers()`,
  `reclaimCardsFromDeliveryStackForOtherPlayers()` in `card-play.service.ts`,
  zwei Stellen in `heropower.service.ts`). **Bis Issue #87 fehlte `queryAll()`/`queryLatest()`
  hier der Umschaltpunkt** (nur `getDoc()`/`setDoc()`/`updateFields()` hatten ihn) — für eine
  lokale gameId fragten beide Methoden tatsächlich (und erfolglos) Firestore ab, statt an
  `LocalGameDocumentStoreService` zu delegieren. Sichtbarster Effekt: nach einem Bosssieg im
  Singleplayer fand `reshuffleAllPlayersForNewDungeon()` keine Spieler und mischte niemandes
  Hand neu (Heldendeck blieb identisch). Jetzt behoben, `queryAll()`/`queryLatest()` sind hier
  gleichrangig mit den übrigen vier Methoden. `setDocMerge()` (Issue #78) — wie `setDoc()`,
  aber mit `{ merge: true }`: legt ein Dokument bei Bedarf an, statt bestehende Felder zu
  überschreiben. Bisher nur von `UserRepositoryService.addJoinedGame()` für `users/{uid}`
  genutzt (nie ein lokaler Pfad); für lokale Pfade fällt die Methode mangels Merge-Unterstützung
  in `LocalGameDocumentStoreService` auf dasselbe Ersetzungsverhalten wie `setDoc()` zurück.
- **`local-game-id.util.ts`** — `isLocalGameId(gameId)`/`LOCAL_GAME_ID_PREFIX` (`'local-'`).
  `DialogGameSettingsComponent.getGameSettings()` vergibt diesen Präfix beim Anlegen eines
  Singleplayer-Spiels; `StartscreenComponent.createGame()` navigiert bei einer lokalen gameId auf
  `local-game/:id` statt `game/:id` (siehe `app.routes.ts`).
- **`local-game-document-store.service.ts`** — bildet dieselbe getDoc/setDoc/updateFields-
  Semantik wie `FirestoreRepositoryService` ab, aber auf `LocalSingleplayerSaveService`
  (LocalStorage) statt Firestore. Kennt nur die zwei Pfadformen, die
  `GameRepositoryService`/`PlayerRepositoryService` verwenden (`['games', gameId]` bzw.
  `['games', gameId, 'player', playerId]`) — ein `setDoc` auf den Game-Pfad legt bei Bedarf einen
  neuen `LocalSingleplayerSave` an (Bootstrap, `player` startet als leeres Feld-Bag, bis der
  Player-Pfad geschrieben wird). `queryAll()` (Issue #87) bildet
  `FirestoreRepositoryService.queryAll()` für die `player`-Subcollection nach
  (`['games', gameId, 'player']`) — ein lokaler Spielstand hat nie mehr als einen Spieler
  (`LocalSingleplayerSave.player` ist ein einzelnes Objekt, keine Map), daher genügt ein
  `getDoc()` auf den Game-Pfad plus der eine `player`, in ein Array gepackt (leer, solange kein
  Save existiert oder dessen Player-Dokument noch nie geschrieben wurde).
- **`firestore-sync.service.ts`** — die beiden Live-Subscriptions, die `PlayerHandComponent`
  braucht (`watchGamesCollection()`, `watchPlayerDoc()`), inkl. `onSnapshot`-Fehler-Callback,
  der als `FirestoreOperationError` auf den Observable-Error-Kanal gemeldet wird statt
  verschluckt zu werden. Reine Zugriffslogik — welche NGXS-Actions aus den Snapshots dispatcht
  werden, bleibt in der Komponente.
- **`game-repository.service.ts`** / **`player-repository.service.ts`** — Lesen/Schreiben von
  Spiel- bzw. Spieler-Dokumenten. Ersetzen die früheren `SaveGameService`/`LoadGameService`/
  `GamePlayerService` (konsolidiert, siehe Plan oben). `updateTimerStartedAt()`/
  `updateTimerPauseState()`/`resetTimer()` sind die Firestore-Writes für den Dungeon-Timer inkl.
  Pause/Reset (`src/app/components/game/CLAUDE.md`); `updateCurrentBoss()`/
  `updateRemainingBosses()` sind die Firestore-Writes für die Boss-Kampagne (siehe
  `card-play.service.ts` unten); `updateStats()` schreibt die vier Kampagnen-Statistik-Zähler
  (`GameStats`, siehe `src/app/components/game/CLAUDE.md`). `addPlayerToGame()` wird seit
  Issue #85 ("Spielstand löschen") auch fürs **Entfernen** genutzt — keine eigene
  "removePlayerFromGame()"-Methode: `GameComponent.deleteOwnMultiplayerData()` filtert die
  eigene `this.players`-Liste und ruft dieselbe Methode mit dem gekürzten Array auf,
  symmetrisch zur bestehenden Race-Condition beim Hinzufügen (Read-Modify-Write auf das
  geteilte Top-Level-Dokument — bei echtem gleichzeitigem Schreiben zweier Clients ist ein
  Lost-Update theoretisch möglich, bewusst akzeptiert wie an anderen Stellen in diesem Modul).
  Seit Issue #76: jede schreibende
  Methode in beiden Services schreibt zusätzlich `lastActivityAt: serverTimestamp()` mit
  (privates `withActivity()` in beiden Klassen, TTL-Grundlage für PR 5) — **bewusste Ausnahme**
  vom sonst gültigen "keine eigene lokal/Firestore-Fallunterscheidung in dieser Klasse"-Prinzip
  oben: `withActivity()` prüft selbst `isLocalGameId(gameId)` und lässt das Feld für lokale
  Singleplayer-Spielstände weg, weil sonst ein Firestore-`serverTimestamp()`-Sentinel (ein
  FieldValue-Objekt, kein echter Zeitstempel) in `LocalSingleplayerSaveService`s LocalStorage-JSON
  landen würde. `users/{uid}.lastActivityAt` (fürs Profil-Dokument selbst) ist davon nicht
  erfasst — offene Design-Frage, siehe PR 5 in
  `docs/done/login-multiplayer-onboarding-plan.md`.

### TTL-Policy auf `lastActivityAt` (Issue #77, PR 5) — externe Konfiguration, kein Code hier

Die Design-Frage aus dem Plan ist entschieden: TTL-Policy nur auf `users/{uid}` und
`games/{gameId}/player/{playerId}`, **nicht** auf das geteilte `games/{gameId}`-Dokument selbst
(sonst würde eine noch aktive Multiplayer-Runde gelöscht, nur weil ein einzelner Mitspieler
inaktiv ist — siehe `firestore.rules`-Kommentar und `firestore.rules.test.js`, Describe-Block
"games/{gameId} mit einem TTL-gelöschten Mitspieler-Dokument").

- **Konfiguration passiert außerhalb dieses Repos** (Firebase Console → Firestore → TTL-Policies,
  oder `gcloud firestore fields ttls update lastActivityAt --collection-group=users
  --enable-ttl` bzw. `--collection-group=player` für die Player-Subcollection) — kein
  Code-Artefakt hier, da Firestore TTL-Policies nicht Teil der Security Rules sind. **Noch nicht
  konfiguriert** (Stand Issue #77) — Patrick muss das einmalig in der Firebase Console für das
  Projekt `hero-dungeon` einrichten, bevor die TTL-Löschung tatsächlich greift.
- Der zugehörige **Firebase-Auth-User wird bewusst nicht gelöscht**, wenn seine Firestore-Daten
  per TTL verschwinden (kein Cloud-Function-Scheduler in diesem Projekt) — bekannte
  "Account-Leiche" ohne Datenzugriff, siehe Zielbild in
  `docs/done/login-multiplayer-onboarding-plan.md`.
- **Anwendungsseitige Ausfalltoleranz:** `GameComponent.loadHandstack()` (`game/CLAUDE.md`)
  behandelt ein fehlendes eigenes `games/{gameId}/player/{playerId}`-Dokument (Rejoin nach
  TTL-Löschung während der Nutzer inaktiv war) wie einen frischen Beitritt, statt `undefined` in
  Hand-/Ablagestapel zu dispatchen. Für die **übrigen** Mitspieler war keine Code-Änderung nötig:
  `CardPlayService`s "alle Spieler"-Operationen (`applyEventToOtherPlayers()`,
  `drawCardsForOtherPlayers()`, `reshuffleAllPlayersForNewDungeon()`) lesen die Spielerliste
  bereits live per `FirestoreRepositoryService.queryAll()` statt über die (potenziell veraltete)
  `choosenHeros`-Liste — ein per TTL gelöschtes Spieler-Dokument taucht in der Query schlicht
  nicht mehr auf. Die Zielspieler-Methoden (`resolveSpende()`/`resolveStehlen()`/
  `resolveHeilkraeuter()`/`resolveHeilung()`/`drawCardsForTarget()`/
  `reclaimCardsFromDeliveryStackForTarget()`) lesen ein gewähltes Ziel-Dokument bereits
  durchgängig mit `data?.[...] ?? []`-Fallbacks, werfen also ebenfalls keine Exception, wenn das
  Ziel inzwischen verschwunden ist (der Schreibversuch auf das fehlende Dokument schlägt dann
  zwar über `reportWriteFailure()` sichtbar fehl, aber kontrolliert/asynchron, nicht als
  Absturz).

### "Spielstand löschen" (Issue #85)

- **Singleplayer**: `LocalSingleplayerSaveService.deleteSave(saveId)` — vollständige lokale
  Löschung, analog zu `createSave()`/`updateSave()`.
- **Multiplayer**: `PlayerRepositoryService.deleteOwnPlayerDoc(gameId, playerId)` löscht nur das
  eigene `games/{gameId}/player/{playerId}`-Dokument über eine neue
  `FirestoreRepositoryService.deleteDoc(path)`-Methode. `deleteDoc()` ist **bewusst ohne**
  lokalen Zweig (im Unterschied zu `getDoc()`/`setDoc()`/`setDocMerge()`/`updateFields()` oben) —
  der einzige Aufrufer wird nie mit einer lokalen gameId aufgerufen, ein lokaler Spielstand wird
  komplett über `LocalSingleplayerSaveService.deleteSave()` gelöscht, nicht dokumentweise. Das
  geteilte `games/{gameId}`-Dokument selbst wird **nicht** gelöscht, nur der eigene Eintrag aus
  `choosenHeros` entfernt (`addPlayerToGame()`, siehe oben) — die übrigen Mitspieler vertragen
  ein fehlendes Spieler-Dokument bereits (Issue #77, PR 5, siehe TTL-Abschnitt oben), kein
  zusätzlicher Fix nötig.
- **Bewusst kein Automatismus für ein leeres, verwaistes `games/{gameId}`-Dokument** (letzter
  Spieler verlässt/löscht): Issue #85 verlangt explizit eine bewusste Entscheidung statt eines
  automatischen Aufräumens. Entscheidung: **verwaisen lassen**, analog zu den TTL-
  "Account-Leichen" aus Issue #77 oben — konsistent mit der bereits etablierten "keine
  automatische Löschinfrastruktur"-Haltung in diesem Projekt. Kann bei Bedarf revidiert werden,
  ist aber kein aktueller Blocker.
- **Firestore Rules**: keine Änderung nötig — `write` auf das eigene Player-Dokument
  (`request.auth.uid == playerId`) deckt bereits ein implizites `delete()` ab, siehe
  `firestore.rules.test.js` ("allows a player to delete their own save state").
- **UI**: `GameMenuComponent` (`game-menu/CLAUDE.md`) und `StartscreenComponent`s "Meine
  Spielstände" nutzen beide den neuen generischen `DialogConfirmComponent`
  (`components/CLAUDE.md`, Abschnitt Dialoge) für die Bestätigung vor dem Löschen.
- **`current-user.service.ts`** — Auth-State (`@angular/fire/auth`) + zugehöriges
  Firestore-Nutzerdokument. Für anonyme Multiplayer-Nutzer (Issue #76) ohne eigenes
  `users/{uid}`-Dokument/ohne `userEmail` unverändert sicher: `getCurrentUser()` liest
  `userNickname` bereits mit `?? 'Gast'`-Fallback und referenziert `userEmail` nirgends —
  kein Code-Änderung hier nötig.
- **`user-repository.service.ts`** (Issue #78) — Firestore-Zugriffe auf das `users/{uid}`-Profil-
  Dokument, getrennt von `GameRepositoryService`/`PlayerRepositoryService` (die decken
  `games/{gameId}`-Pfade ab, nicht den Account selbst). `getUser(uid)` liest das Dokument roh.
  **`games`-Feldformat geändert (2026-09-05, Spielstand-Auswahldialog):** war `string[]` (nur
  gameId), ist jetzt `JoinedGame[]` (`{ gameId, lastPlayedAt: number }`), damit "Meine Spiele" im
  neuen `DialogSelectSaveComponent` (`components/CLAUDE.md`, Abschnitt Dialoge) ein "zuletzt
  gespielt"-Datum anzeigen kann. `getJoinedGames(uid)` liest + normalisiert in einem Schritt
  (`normalizeJoinedGames()`, privat) — ein alter `string`-Eintrag aus der Zeit vor dieser
  Umstellung wird zu `{ gameId, lastPlayedAt: 0 }` gemappt (sortiert dadurch im Dialog automatisch
  ans Ende der "zuletzt gespielt"-Sortierung), ein bereits migrierter Eintrag bleibt unverändert.
  Aufrufer (`StartscreenComponent`/`GameMenuComponent`) sollten `getJoinedGames()` statt
  `getUser()` + eigener Normalisierung verwenden. `addJoinedGame(uid, gameId)` trägt eine gameId
  in diese Liste ein — schreibt seit der Umstellung **kein** `arrayUnion()` mehr (das dedupliziert
  nur exakt gleiche Werte, `lastPlayedAt` ändert sich aber bei jedem erneuten Beitritt), sondern
  liest die aktuelle Liste, entfernt einen evtl. vorhandenen Eintrag zur selben gameId und hängt
  einen frischen `{ gameId, lastPlayedAt: Date.now() }`-Eintrag an — Read-Modify-Write über
  `FirestoreRepositoryService.setDocMerge()` (`{ merge: true }`, da ein anonymer Nutzer zu diesem
  Zeitpunkt noch **kein** `users/{uid}`-Dokument hat, das entstand bisher nur bei
  `AuthFormService.register()`); bei echtem gleichzeitigem Schreiben zweier Clients ist ein
  Lost-Update theoretisch möglich, analog zu den übrigen Read-Modify-Write-Stellen in diesem
  Modul (siehe `addPlayerToGame()` oben). Schreibt dabei außerdem `lastActivityAt:
  serverTimestamp()` — löst damit die in PR 4 offen gelassene Frage ("`users/{uid}.lastActivityAt`
  ist davon nicht erfasst") auf: Der erste reguläre Schreibzugriff auf `users/{uid}` für einen
  anonymen Nutzer ist genau dieser, ein zusätzlicher separater Schreibpfad nur für
  `lastActivityAt` wäre unnötig. Aufrufer: `StartscreenComponent.newGame()`s `createGame()`
  (nur, wenn `!isLocalGameId(gameId)` — Singleplayer hat kein Account-Konzept) und `joinGame()`.
- **`local-singleplayer-save.service.ts`** — CRUD (`listSaves()`/`createSave()`/`getSave()`/
  `updateSave()`/`deleteSave()`, letzteres Issue #85) für lokale Singleplayer-Spielstände,
  komplett ohne Firestore/Auth (LocalStorage,
  Schlüssel `hero-dungeon.local-singleplayer-saves`). Persistenz-Unterbau für
  `docs/done/login-multiplayer-onboarding-plan.md` PR 1 (Issue #73) — ein `LocalSingleplayerSave`
  bündelt `game: Game` + `player` (loses Feld-Bag, `Record<string, unknown>` — Spieler-Dokumente
  werden von `GameRepositoryService`/`PlayerRepositoryService` per generischem `updateFields()`
  mit beliebigen Teilmengen beschrieben, ein festes Interface würde das nicht abbilden), analog
  zu `games/{gameId}` + Player-Dokument, nur lokal serialisiert. Inzwischen über
  `LocalGameDocumentStoreService`/`FirestoreRepositoryService` an `GameComponent`/
  `CardPlayService`/`PlayerHandComponent` angebunden (siehe `firestore-repository.service.ts`
  unten) — `PlayerHandComponent.ngOnInit()` überspringt für eine lokale gameId das
  Firestore-Live-Sync (kein Mitspieler, dessen Züge ankommen könnten; der Store wird bei jeder
  eigenen Aktion ohnehin synchron aktualisiert), lädt aber per `loadLocalGameOnce()` einmalig
  denselben Store-Aufbau, den sonst der erste Firestore-Snapshot liefert — sonst bliebe der Store
  beim **Fortsetzen** eines bestehenden lokalen Saves (z.B. nach einem Reload) leer, siehe
  `player-hand/CLAUDE.md`.

## Business-Logik-Services (kein/kaum Firestore-Zugriff)

- **`card-play.service.ts`** — Karten-/Encounter-Regeln (Karte ausspielen, Encounter-Auflösung
  inkl. Singleplayer-Sonderfälle). **Fehlerbehandlung (2026-09-05, Architecture-Review-Kandidat
  1):** alle öffentlichen Methoden geben ein `Promise<void>` zurück statt (wie zuvor) einen
  `reportWriteFailure`-Callback als letzten Parameter entgegenzunehmen — die Promise rejected,
  sobald einer der intern ausgelösten, weiterhin fire-and-forget laufenden Firestore-Writes
  fehlschlägt (`Promise.all(writes)` über alle gesammelten Write-Promises einer Methode, keine
  Einzelmeldung mehr pro Write). Aufrufer (`PlayerHandComponent`/`GameComponent`) hängen ihr
  eigenes `.catch()` mit einer für ihren Call-Site passenden Fehlermeldung an die zurückgegebene
  Promise, statt eine Callback-Closure durchzureichen — vorher fädelte sich `ReportWriteFailure`
  unverändert durch ~40 private Hilfsmethoden, obwohl nur die ~14 öffentlichen Einstiegspunkte
  tatsächlich unterschiedliche Fehlermeldungen brauchen. Kein Instanzfeld für diesen Zustand:
  `CardPlayService` ist ein Singleton, mehrere private Hilfsmethoden sind bereits `async` (haben
  also echte Await-Punkte) - ein geteiltes Feld wäre bei zeitlich überlappenden Aufrufen nicht
  sicher. Private Hilfsmethoden, die sowohl einen Wert zurückgeben als auch selbst schreiben
  (`checkHandsize()`, `drawCards()`), bündeln Wert + noch laufende Write-Promises in einem
  `WithWrites<T>`-Objekt (`{ value, writes }`), das der Aufrufer synchron ausliest und dessen
  `writes` er in seine eigene Sammlung übernimmt. `HeropowerService` (unten) hat dieselbe
  Umstellung im selben Zug mitbekommen. `chooseCard()` ist der Einstiegspunkt für alle Karten
  ohne weitere Nutzereingabe — neue Kartenregeln hier einhängen, nicht an der Komponente vorbei.
  `resolveEvent()` (aufgerufen über den "Event ausführen"-Button in `PlayerHandComponent`,
  sichtbar sobald `currentEnemy().token.includes('event')` — Spielerzahl-unabhängig) wendet den
  Ereignis-Effekt auf ALLE Spieler an (`applyEventToSelf()`/`applyEventToOtherPlayers()`), nicht
  nur auf den klickenden Spieler; "Chaos" ist dabei vereinfacht wie "Plötzliche Krankheit"
  behandelt (siehe Kommentar an `resolveEvent()` — die Anleitung gibt keine feste
  Weitergabe-Reihenfolge für "gibt seine Handkarten einem Mitspieler" vor). In `chooseCard()`
  darf nur die Karte `verhinderung_event` (Magier/Zauberin) eine Ereigniskarte stoppen — vorher
  löste jede beliebige Doppelkarte ein Event auf, weil nur geprüft wurde, ob überhaupt ein Event
  anliegt, nicht welche Karte gespielt wurde.
  Startet außerdem per `ensureGameTimerStarted()` den Dungeon-Timer bei der ersten wirksam
  gespielten Karte und beendet per `resumeGameTimerIfPaused()` eine laufende Magier-/
  Göttlicher-Schild-Pause, sobald eine Karte in die Tischmitte gespielt wird;
  `resolveGoettlicherSchild()`, `resolveHeiligeHandgranate()` und `resolveHeiltrank()` behandeln
  die gleichnamigen Karten als Sonderfall (keine passen zu Dungeon-Symbolen, sind aber jederzeit
  spielbar) — Details zum Gesamt-Feature in `src/app/components/game/CLAUDE.md`. Fünf weitere
  Aktionskarten mit Zielspieler-Auswahl (Spende, Stehlen, Heilkräuter, Wut, Heilung) haben
  eigene öffentliche `resolve*()`-Methoden, die **nicht** über `chooseCard()` laufen, sondern
  direkt von `PlayerHandComponent` aufgerufen werden, nachdem dort ein Zielspieler-Dialog
  geschlossen wurde (`chooseCard()` selbst würde diese Kartennamen nicht erkennen).
  `checkForNextEnemy()` setzt bei besiegtem Boss **nicht automatisch** den nächsten Dungeon auf,
  sondern `gameStatus: 'bossDefeated'` (sofern `EncounterSelectors.currentAllBosses()` — die
  Warteschlange der noch ausstehenden Bosse #2-#5 — nicht leer ist, sonst direkt `'won'`) — die
  Gruppe wird erst gefragt, ob sie weitermacht (`GameComponent`, siehe
  `src/app/components/game/CLAUDE.md`). `continueToNextDungeon(gameId, playerId, ...)` (öffentlich,
  von `GameComponent` nach Bestätigung aufgerufen) baut per `new Monster().createMob(...)` den
  Dungeon-Kartenstapel für den nächsten Boss, setzt den Timer per `ResetGameTimer` zurück und
  mischt über `reshuffleAllPlayersForNewDungeon()` jedes Spielers Heldendeck frisch (Anleitung
  S. 6: "Mischt die 40 Karten eines jeden Helden-Decks... und legt das Deck... auf das Feld
  Nachziehstapel") — dafür wird der Heldenname aus dem Spieler-Dokument gegen `HERO_DEFINITIONS`
  zurückgemappt (Player-Dokumente speichern aktuell keine `HeroId`, nur den Anzeigenamen).
  `restartCampaign(gameId, playerId, ...)` (nach verlorenem Dungeon) macht dasselbe, aber zurück
  auf Boss #1 (`GameFactoryService.buildNewGame()`), analog zu Anleitung S. 7 ("versucht euer
  Glück von neuem mit dem Baby-Barbar"). `resolveJoker()`/`resolveMagischeBombe()` behandeln die
  Jägerin/Waldläufer- bzw. Magier/Zauberin-Karten `joker`/`magischeBombe` als weiteren Sonderfall
  (matchen kein festes Dungeon-Symbol): Joker verbraucht ein beliebiges (erstes) Token der
  aktuellen Bedrohung, Magische Bombe je ein Vorkommen jeder der 5 Symbolfarben — beide wirken
  nicht gegen Ereigniskarten. Da es keine Auswahl-UI für "welches Symbol nutzen" gibt, ist die
  Tokenwahl deterministisch statt spielerseitig frei wählbar (Vereinfachung, analog zur
  automatischen Doppelsymbol-Karten-Auflösung).
  `checkHandDeadlockLoss(gameId, hand, cardStack, deliveryStack, ...)` (TODO 11, erster von zwei
  diagnostizierten Verlustwegen) setzt `gameStatus: 'lost'`, sobald ein Spieler gleichzeitig
  leere Hand-, Nachzieh- und Ablagestapel hat (kann seine Hand nicht mehr auffüllen) und der
  Status noch `'playing'` ist. Aufgerufen aus `persistPlayerStacks()` (deckt `checkHandsize()`,
  `drawCardsIgnoringHandsize()`, `restCard()`, `resolveSpende()` ab), `applyEventToPlayerData()`
  und `resolveStehlen()` — Stehlen ist praktisch der einzige Weg, diesen Zustand tatsächlich zu
  erreichen, da beim normalen Kartenausspielen die abgelegte Karte selbst sofort zurückgemischt
  und nachgezogen wird, solange irgendwo (Hand/Nachzieh-/Ablagestapel) noch eine Karte liegt. Die
  zweite Verlustbedingung ("Gruppe kann die geforderten Symbole nicht mehr aufbringen") ist
  bewusst nicht umgesetzt — siehe TODO 11 im Plan.
  `bumpStat()`/`ensureGameTimerStarted()`/`checkForNextEnemy()`/`drawCards()`/`restCard()`
  schreiben zusätzlich die Kampagnen-Statistik (`GameStats`) fort — Details in
  `src/app/components/game/CLAUDE.md`.
- **`heropower.service.ts`** — Prüft/löst die zehn unterschiedlichen Heldenfähigkeiten aus.
  Bewusst **nicht** vollständig auf eine gemeinsame Hilfsmethode vereinheitlicht (Walküre/
  Jägerin/"Array"-Gruppe haben einen dokumentierten Verhaltensunterschied im Dispatch-Timing,
  siehe Kommentar/Status direkt in der Datei) — vor einer Vereinheitlichung diesen Unterschied
  erneut prüfen, nicht blind zusammenlegen. `resolveMagierHeropower()` pausiert zusätzlich den
  Dungeon-Timer (`src/app/components/game/CLAUDE.md`). Alle vier `resolve*Heropower()`-Methoden
  zählen über ihr eigenes `bumpStat()` (bewusst nicht mit `CardPlayService.bumpStat()` geteilt)
  die `heropowersUsed`-Statistik hoch. **Fehlerbehandlung (2026-09-05, Folgeschritt zu
  `CardPlayService` oben):** dieselbe Umstellung wie dort — alle öffentlichen Methoden geben
  `Promise<void>` zurück statt einen `reportWriteFailure`-Callback zu akzeptieren, `PlayerHandComponent`
  hängt sein eigenes `.catch()` an die zurückgegebene Promise.
- **`dieb.service.ts`** — heldenspezifische Sonderlogik für den Dieb (Solo-Held im
  Singleplayer-Modus, siehe `docs/done/singleplayer-mode-plan.md`). Zählt seit einem Bugfix
  (2026-09-05) `heropowersUsed` (`GameStats`) nach jeder Nutzung selbst hoch — eigenes,
  drittes `bumpStat`-Analogon zu `CardPlayService`/`HeropowerService` (bewusst nicht geteilt,
  gleiche Begründung wie dort), da der Dieb nicht über `HeropowerService` läuft. Vorher fehlte
  der Zähler hier komplett (Statistik-Anzeige "Genutzte Heldenfähigkeiten" blieb beim Dieb immer
  0), siehe `game/CLAUDE.md` Abschnitt Kampagnen-Statistik.
  **Bugfix (2026-09-05, "Langfinger" zog duplizierte Handkarten):** `heropower()` (Langfinger:
  3 Karten ablegen, 5 nachziehen) schrieb den geschrumpften Nachziehstapel bisher **nur** nach
  Firestore/LocalStorage (`playerRepo.updateCardstack()`), dispatchte aber nie
  `UpdateCardStackAction`. Im Singleplayer gibt es kein Firestore-Live-Sync zurück in den Store
  (`player-hand/CLAUDE.md`) — `currentCardStack` blieb dadurch für den Rest der Session auf dem
  Stand *vor* der ersten Nutzung eingefroren, jede weitere Kartenziehung (erneute
  Heropower-Nutzung, normales Nachfüllen der Hand über `CardPlayService`) las denselben,
  nicht geschrumpften Stapel erneut und zog bereits ausgeteilte Karten ein zweites Mal —
  sichtbar als duplizierte Handkarten (z.B. 4× "Stehlen" aus einem 2-Karten-Deck-Anteil). Jetzt
  dispatcht `heropower()` `UpdateCardStackAction` analog zu `HeropowerService`s
  `resolve*Heropower()`-Methoden. Zusätzlich landeten die 3 abgelegten Karten bisher nirgends
  (nicht auf dem Ablagestapel, wie die Fähigkeitsbeschreibung "Lege 3 Karten auf den
  Ablagestapel" verlangt) — sie verschwanden dauerhaft aus dem Kartenpool statt beim nächsten
  Reshuffle (`CardPlayService.drawCards()`) wieder verfügbar zu werden; jetzt landen sie über
  `UpdateDeliveryStack`/`playerRepo.updateDeliveryStack()` korrekt auf dem Ablagestapel.
- **`game-factory.service.ts`** — baut ein neues `Game`-Objekt (Startscreen: Spiel erstellen).
- **`auth-form.service.ts`** — Login/Register-Aufrufe + Mapping der Firebase-Error-Codes auf
  deutsche Meldungen; von allen Auth-bezogenen Formularen genutzt statt eigenem Error-Mapping
  pro Komponente. `register()` gibt die neue `uid` nicht zurück — Aufrufer, die sie brauchen
  (z.B. `DialogAccountOfferComponent`), lesen sie danach aus `Auth.currentUser?.uid` (Firebase
  meldet den neu registrierten Nutzer automatisch an). Seit Issue #76:
  `ensureAnonymousSession()` (`signInAnonymously()`, nur falls `auth.currentUser` noch leer ist)
  — von `StartscreenComponent.newGame()`/`joinGame()` vor dem eigentlichen Firestore-Zugriff
  aufgerufen, damit ein Multiplayer-Spiel ohne vorheriges Anmeldeformular erstellt/betreten
  werden kann; `newSingleplayerGame()` ruft das bewusst nicht auf (Singleplayer bleibt
  komplett auth-frei). `linkAnonymousAccount(email, password, nickname)` (Issue #78) —
  verknüpft den bereits anonym eingeloggten Nutzer per `linkWithCredential()`/
  `EmailAuthProvider.credential(...)` mit E-Mail/Passwort: **gleiche** `uid` wie zuvor, im
  Unterschied zu `register()` (Issue #75, PR 3) entsteht hier **keine** neue `uid` und damit auch
  kein Migrationsschritt. Ein Fehlschlag (z.B. `auth/email-already-in-use`) meldet den
  bestehenden anonymen Nutzer **nicht** ab — `linkWithCredential()` selbst tut das nicht, und
  dieser Code ruft im `catch`-Zweig kein `signOut()` auf; die Gast-Session bleibt nutzbar.
  Aufrufer: `DialogLinkAccountComponent` (`components/CLAUDE.md`, Abschnitt Dialoge), erreichbar
  über `GameMenuComponent` (`game-menu/CLAUDE.md`).
- **`local-save-migration.service.ts`** — `migrateAll(newUserId, newUserNickname)` (Issue #75,
  PR 3): schreibt **alle** vorhandenen lokalen Singleplayer-Saves (`LocalSingleplayerSaveService.
  listSaves()`) als neue Firestore-Spiele (`GameRepositoryService.createGame()`/
  `PlayerRepositoryService.createPlayer()`), je Save eine frische, nicht-lokale gameId
  (`crypto.randomUUID()`). Löscht die lokalen Saves **nicht** — sie bleiben zusätzlich zur
  Firestore-Kopie bestehen (Abstimmung mit Patrick, 2026-09-04). Bekannte Einschränkung: kein
  "bereits migriert"-Flag auf dem lokalen Save — ein erneuter Aufruf (z.B. nach einem
  Teilfehlschlag) würde bereits migrierte Saves ein zweites Mal als neue Firestore-Spiele
  anlegen (Duplikate), nicht Teil dieses Grundgerüsts.
- **`to-json.service.ts`** — Serialisierung von Domänen-Objekten (Hero/Card/...) für Firestore-
  Writes.

## Muster für neue Services

Neuer Firestore-Zugriff → auf `FirestoreRepositoryService`/`FirestoreOperationError` aufbauen,
nicht erneut rohes `doc()`/`getDoc()` in eine Komponente schreiben. Reine Spielregeln gehören in
einen Business-Logik-Service, nicht in die Komponente — Komponenten sollen nur noch
orchestrieren (Store lesen, Service-Methode aufrufen, Ergebnis anzeigen).
