# Code-Review: Services (Firestore-Zugriff, Business-Logik)

## Status (2026-08-29, PR #21)

Umgesetzt: `updateCurrentEnemyToken`/`updateNewEnemy` in `SaveGameService` gemergt (Teil von
Befund 1), `SaveGameService`-Methoden geben jetzt das `updateDoc`-Promise zurück statt es
fire-and-forget zu verschlucken (Teil von Befund 4), `DiebService`s Firestore-Writes aus der
Schleife auf einen Write danach reduziert (Befund 6), `CurrentGameService` gelöscht (toter
Code, Teil von Befund 8), `LoadGameService`-Geisterimport in `PlayerHandComponent` entfernt und
`loadNewEnemy`/`loadNewMob`/`loadCurrentEnemyToken` (ungenutzt) entfernt, dabei die
`collectionData`-Race-Condition in `loadPlayerCollectionData`/`loadGameCollectionData` behoben
(Befund 2), `DiebServiceService` → `DiebService` umbenannt (Befund 7), `console.warn`-Reste
entfernt (Befund 5).

Offen, siehe [`../firestore-repository-service-plan.md`](../firestore-repository-service-plan.md):
generischer `FirestoreRepositoryService` mit zentralem Error-Handling (Befund 1/2/4 vollständig,
inkl. `await`/try-catch an den Aufrufstellen), Konsolidierung von `SaveGameService`/
`GamePlayerService`/`LoadGameService` auf Repository-Services pro Aggregat (Befund 8), Firestore
per DI statt `getFirestore()`/`initializeApp()` (Befund 3), Verhaltens-Tests statt „should
create" (Befund 10). Nicht umgesetzt, nice-to-have und noch nicht neu geplant: `any`/`Object`-
Typisierung durch Firestore-Converter ersetzen (Befund 9).

## Überblick

Scope: `src/app/services/{current-game,current-user,dieb-service,game-player,load-game,save-game,to-json}.service.ts`
(543 Zeilen inkl. `.spec.ts`, reine Services ohne die `.spec.ts` ca. 280 Zeilen).

Ist-Zustand: Kein Repository-Layer, kein gemeinsamer Basis-Service. Jeder Service, der
Firestore anfasst, holt sich `getFirestore()` selbst (teils als Feld-Initialisierung, teils
per `initializeApp()` im Methodenkörper) und baut den `doc(...)`/`collection(...)`-Pfad
`'games', gameId[, 'player', playerId]` immer wieder neu zusammen. Es gibt **keinen einzigen
try/catch** um einen Firestore-Aufruf in den sieben Services. Die Tests sind bis auf
`ToJSONService` (indirekt, weil trivial) durchgehend generierte "should create"-Stubs ohne
Verhaltensprüfung — `dieb-service.service.spec.ts` fehlt sogar komplett (Service ohne jeden
Test). Zwei Services (`CurrentGameService`, teilweise `LoadGameService`) sind faktisch toter
oder nicht mehr genutzter Code. Die im Auftrag genannten Duplikate in `SaveGameService` und
`LoadGameService` bestätigen sich; es kommen mehrere weitere Funde hinzu (Naming, God-Object
in `PlayerHandComponent` als Konsument, fehlende Nullchecks).

## Befunde

### 1. `SaveGameService`: Sechs Methoden sind strukturell identisch (DRY-Verstoß)

**Betroffene Dateien:** `save-game.service.ts:13-68`

**Problem:** Alle sechs Methoden (`updateHandstack`, `updateCardstack`, `updateDeliveryStack`,
`updateCurrentEnemyToken`, `updateNewEnemy`, `updateNewMob`, `updateQuestStatus` — sieben,
nicht sechs) folgen exakt demselben Muster: `doc()`-Referenz bauen → Objekt mit einem Feld
literal zusammenbauen → `updateDoc()` aufrufen, ohne `await`/Rückgabewert/Fehlerbehandlung.
`updateCurrentEnemyToken` (Z.38-44) und `updateNewEnemy` (Z.46-52) sind **byteidentisch**
implementiert (gleicher Pfad, gleiches Feld `currentEnemy`, gleiche Signatur) — zwei Namen für
dieselbe Operation. Das lädt zu Inkonsistenzen ein: Ruft ein Aufrufer versehentlich die
"falsche" der beiden Methoden, ändert sich am Verhalten nichts, aber der Code suggeriert zwei
verschiedene Fachkonzepte ("neuer Gegner" vs. "aktuelles Gegner-Token"), die es Firestore-seitig
gar nicht gibt.

Zusätzlich: `updateDeliveryStack` (Z.29-36) enthält einen vergessenen Debug-Log
(`console.warn('delStack', update)`, Z.34) — siehe Befund 5.

**Vorschlag (kritisch):** Auf eine generische `updateGameField`/`updatePlayerField`-Methode
konsolidieren, die Pfad-Segmente + partielles Update-Objekt entgegennimmt:

```ts
// firestore-repository.service.ts (neu, generisch, DI-fähig)
@Injectable({ providedIn: 'root' })
export class FirestoreRepositoryService {
  constructor(private db: Firestore) {} // via provideFirestore() injiziert statt getFirestore()

  async updateFields<T extends object>(path: string[], update: Partial<T>): Promise<void> {
    try {
      await updateDoc(doc(this.db, ...path), update as DocumentData);
    } catch (err) {
      // zentrales Error-Handling, siehe Befund 4
      throw new FirestoreOperationError('update', path, err);
    }
  }
}

// SaveGameService wird zu dünnen, fachlich benannten Wrappern:
updateHandstack(gameId: string, playerId: string, handstack: string[]) {
  return this.repo.updateFields(['games', gameId, 'player', playerId], { handstack });
}
```

`updateCurrentEnemyToken`/`updateNewEnemy` auf eine Methode zusammenlegen (Aufrufer in
`player-hand.component.ts` entsprechend anpassen — das ist aber Komponenten-Scope, siehe
separates Review-Dokument).

### 2. `LoadGameService`: `loadNewEnemy`/`loadNewMob` identisch, drittes ähnliches Muster in `loadCurrentEnemyToken`

**Betroffene Dateien:** `load-game.service.ts:40-59`

**Problem:** `loadNewEnemy` (Z.47-52) und `loadNewMob` (Z.54-59) sind zeilengleich (bis auf den
Variablennamen `newEnemyRef`/`currentEnemyTokenRef`, der in `loadNewMob` sogar denselben Namen
trägt wie in `loadCurrentEnemyToken` — Copy-Paste-Spur). Beide lesen `games/{gameId}` und geben
`data['currentEnemy']` zurück; es gibt keinen fachlichen Unterschied zwischen "neuer Gegner" und
"neuer Mob" im Code, nur im Namen. `loadCurrentEnemyToken` (Z.40-45) liest denselben Pfad und
greift zusätzlich `.token` ab — ein Sonderfall derselben Grundoperation.

Ebenfalls auffällig: `loadPlayerCollectionData` (Z.20-28) und `loadGameCollectionData`
(Z.30-38) sind strukturell identisch (Collection-Query mit `where`, `forEach` über
`QuerySnapshot`, letztes Element gewinnt) — nur Collection-Pfad und Feldname unterscheiden sich.
Beide nutzen zudem ein **gemeinsames Instanzfeld** `collectionData` als Zwischenspeicher
(Z.17), was bei parallelen Aufrufen (z.B. `loadPlayerCollectionData` und
`loadGameCollectionData` gleichzeitig awaited) zu einer Race Condition führen kann: Der
`forEach`-Callback von Query A kann `this.collectionData` überschreiben, bevor Query B ihren
Rückgabewert liest. Da `getDocs` intern async auflöst, ist die Reihenfolge nicht garantiert.

**Vorschlag (kritisch für die Duplikate, wichtig für die Race Condition):**
- `loadNewEnemy`/`loadNewMob` zu einer Methode `loadCurrentEnemy(gameId)` zusammenlegen; Aufrufer
  migrieren.
- `loadCurrentEnemyToken` als `.token`-Projektion von `loadCurrentEnemy` ausdrücken, nicht als
  eigenen Firestore-Roundtrip.
- `collectionData` als Instanzfeld entfernen, stattdessen lokale Variable/Rückgabewert direkt
  aus `getDocs()` ableiten (z.B. `docSnap.docs[0]?.data()` statt `forEach` mit Seiteneffekt) —
  behebt Race Condition und macht die Methode zustandslos/wiedereintrittsfest.
- Beide Collection-Loader auf eine generische `queryFirstDoc(collectionPath, field, value)`
  reduzieren (gleiches Repository-Pattern wie Befund 1).

### 3. Firestore-Bootstrapping dreifach unterschiedlich implementiert

**Betroffene Dateien:** `current-game.service.ts:18-20`, `current-user.service.ts:30-32`,
`game-player.service.ts:13`, `load-game.service.ts:16`, `save-game.service.ts:10`

**Problem:** Fünf verschiedene Arten, an eine `Firestore`-Instanz zu kommen:
- `CurrentGameService.getCurrentGame()` (Z.19-20) ruft bei **jedem** Methodenaufruf erneut
  `initializeApp(environment.firebase)` + `getFirestore()` auf, statt die App einmal zu
  initialisieren (typischerweise über `provideFirebaseApp()`/`provideFirestore()` in der
  App-Config, wie es `@angular/fire` v7+ vorsieht). Mehrfaches `initializeApp()` mit derselben
  Config ist zwar in der Firebase-JS-SDK idempotent (liefert dieselbe App zurück oder wirft, je
  nach Version), aber es verschleiert, dass hier keine DI genutzt wird, und jeder Aufruf zahlt
  unnötigen Overhead.
- `CurrentUserService.getCurrentUser()` (Z.30-32) macht dasselbe zusätzlich für `getAuth()`.
- `GamePlayerService` (Z.13), `LoadGameService` (Z.16), `SaveGameService` (Z.10) rufen
  `getFirestore()` als Feld-Initialisierer auf — ohne `initializeApp()` davor; funktioniert nur,
  weil zufällig vorher irgendwo (`AppModule`/`bootstrapApplication`) schon eine Default-App
  existiert. Das ist implizite Kopplung an Initialisierungsreihenfolge, die beim Lesen des
  einzelnen Service-Files nicht ersichtlich ist.
- Keiner der Services injiziert `Firestore` über den DI-Konstruktor (`private db: Firestore =
  inject(Firestore)` bzw. Konstruktor-Parameter), obwohl `@angular/fire` v7 genau dafür einen
  injizierbaren `Firestore`-Token bereitstellt.

**Vorschlag (wichtig):** `Firestore` konsequent per Constructor-Injection (oder `inject()`)
beziehen, `initializeApp()` nirgends mehr manuell in Services aufrufen. Das ist Voraussetzung
dafür, Services in Tests mit `TestBed`-Providern zu mocken, statt (wie aktuell) einen echten
Emulator/Test-App-Bootstrap zu brauchen (`ensureFirebaseTestAppInitialized()` in den `.spec.ts`
von `GamePlayerService`/`LoadGameService`/`SaveGameService` — ein Hinweis, dass die fehlende
Injectability bereits Testkosten verursacht).

### 4. Kein Error-Handling um einen einzigen Firestore-Aufruf

**Betroffene Dateien:** alle sieben Services, konkret:
- `current-game.service.ts:22` (`getDoc`), `:23` (`docSnap.data()` ohne Null-Check — bei
  nicht-existentem Dokument liefert `data()` `undefined`, der Rückgabewert wird ungeprüft
  durchgereicht)
- `current-user.service.ts:38-39` (`getDoc` + `docSnap.data()!` — **Non-null-Assertion** auf
  potenziell `undefined`; Z.40-41 lesen `this.currentUserData!['userNickname']` /
  `['userId']` ungetypt und ohne Prüfung, ob die Felder existieren)
- `game-player.service.ts:16,21,27-28,32,36,40` (jede `getDoc`/`setDoc`/`updateDoc` ohne
  try/catch; `createPlayer()` Z.25-28 macht zwei sequenzielle Awaits ohne Transaktion — schlägt
  `updateDoc` nach erfolgreichem `setDoc` fehl, bleibt ein halb angelegter Player-Doc zurück)
- `load-game.service.ts:23,33,42,49,56` (`getDocs`/`getDoc`); zusätzlich `:43,50,57` nutzen
  `docSnap.data()!['currentEnemy']` — Non-null-Assertion, obwohl `data()` bei fehlendem
  Dokument `undefined` ist und das Programm dann mit einer wenig aussagekräftigen
  `TypeError: Cannot read properties of undefined` abstürzt statt einer fachlichen Fehlermeldung
- `save-game.service.ts:18,26,35,43,51,59,67` (`updateDoc` wird **nicht einmal awaited** —
  die Promises verhallen ungeprüft; ein fehlgeschlagenes Update (Netzwerkfehler, Security-Rule-
  Verstoß) wird von keinem Aufrufer bemerkt, der Spielzustand in Firestore divergiert dann
  stillschweigend vom lokalen NGXS-State)
- `dieb-service.service.ts:42,43,45,46` (ruft `saveGame.updateHandstack`/`updateCardstack` in
  einer Schleife auf, ebenfalls ungeprüft — siehe Befund 6)

**Vorschlag (kritisch):** Laut CLAUDE.md bekannte Baustelle ("Kein Interceptor/Guard-Layer um
Firestore-Fehler"), hier services-seitig konkretisiert. Zwei Teile:
1. Alle Schreib-Methoden `async` machen und `await`en (v.a. `SaveGameService`, das aktuell
   überhaupt nicht async ist, obwohl `updateDoc` ein `Promise<void>` zurückgibt).
2. Zentraler Wrapper im vorgeschlagenen `FirestoreRepositoryService` (siehe Befund 1/2), der
   Firestore-Fehler auf eine anwendungsspezifische Fehlerklasse abbildet, damit Aufrufer (z.B.
   `PlayerHandComponent`) einheitlich reagieren können (Retry, Nutzer-Hinweis "Verbindung
   verloren"), statt dass jeder Service-Aufrufer einzeln `try/catch` um jeden Call schreiben
   muss.

### 5. `console.warn`-Reste im Produktivcode

**Betroffene Dateien:** `dieb-service.service.ts:49` (`console.warn('Success')` — meldet
"Erfolg" per `warn`-Log-Level, fachlich falsch eingestuft), `save-game.service.ts:34`
(`console.warn('delStack', update)` — Debug-Ausgabe des zu speichernden Delivery-Stacks)

**Vorschlag (nice-to-have):** Entfernen bzw. durch echtes Logging/Fehlerbehandlung ersetzen,
sobald Befund 4 umgesetzt ist (dann gibt es einen sinnvollen Ort für Erfolgs-/Fehler-Feedback).

### 6. `DiebServiceService`: Business-Logik + wiederholte, unnötige Firestore-Writes in einer Schleife

**Betroffene Dateien:** `dieb-service.service.ts:37-48`

**Problem:** Die `for`-Schleife (`i < 5`) ruft bei **jeder** Iteration erneut
`saveGame.updateHandstack`/`updateCardstack` auf, obwohl sich `currHand`/`currCardStack`
zwischen den Iterationen nur um je eine Karte ändern und am Ende sowieso nur der letzte Stand
zählt — das sind bis zu 10 Firestore-Writes für einen fachlichen Vorgang ("Dieb zieht bis zu 5
Karten nach"), ohne dass die Zwischenstände irgendwo gebraucht werden. Der `if/else`-Zweig
(Z.38-47) ist zudem redundant: Beide Branches rufen exakt dieselben zwei Methoden mit denselben
Argumenten auf — das `if (currCardStack.length > 0)` hat keinen Effekt auf das, was passiert,
nur auf das *ob vorher noch eine Karte verschoben wurde*. Das lässt sich zu einem einzelnen
Write nach der Schleife vereinfachen. Außerdem: Klassenname `DiebServiceService` (Datei
`dieb-service.service.ts`) — siehe Befund 7.

Weiterer SRP-Hinweis: Der Service kombiniert NGXS-Dispatches (State-Mutation im Client),
Firestore-Persistenz (`saveGame.*`) und die fachliche "Dieb zieht Karten nach"-Regel in einer
einzigen Methode (Z.18-52). Ein Fehler beim Firestore-Write mitten in der Schleife lässt Store
und Firestore in unterschiedlichen Zuständen zurück (siehe auch Befund 4) — es gibt keine
Garantie, dass `store.dispatch` und `saveGame.update*` atomar zusammen gelingen.

**Vorschlag (wichtig):** Schleife auf reine Datenverarbeitung (kein Firestore-Zugriff)
reduzieren, danach **einmal** persistieren:

```ts
heropower(heropowerArray: string[]) {
  // ... currHand/currCardStack wie bisher berechnen (reine Funktion) ...
  for (let i = 0; i < 5 && currCardStack.length > 0; i++) {
    currHand.push(currCardStack.shift()!);
  }
  this.store.dispatch(new UpdateCurrentHandAction(currHand));
  return this.saveGame
    .updateHandstack(gameId, playerId, currHand)
    .then(() => this.saveGame.updateCardstack(gameId, playerId, currCardStack));
}
```

### 7. Naming-Inkonsistenzen

**Betroffene Dateien:** `dieb-service.service.ts` (Klasse `DiebServiceService`), diverse

**Problem:**
- `dieb-service.service.ts` → Klasse `DiebServiceService`: redundantes "-service.service" /
  "Service...Service". Zusätzlich Deutsch (`dieb`, "Dieb" = Held-Klasse "Dieb"/Rogue) gemischt
  mit sonst durchgängig englischen Servicenamen (`SaveGameService`, `LoadGameService`,
  `GamePlayerService`) — passt zur in CLAUDE.md bereits dokumentierten Deutsch/Englisch-Mischung,
  hier aber zusätzlich mit dem doppelten "Service"-Suffix eine eigene, vermeidbare
  Inkonsistenz.
- `SaveGameService`/`LoadGameService` vs. `GamePlayerService`: Namen suggerieren eine klare
  Trennung "Spiel speichern/laden" vs. "Spieler-Zugriff", decken sich aber inhaltlich teilweise
  (`SaveGameService.updateHandstack`/`updateCardstack` und
  `GamePlayerService.updatePlayerCards` schreiben beide `handstack`/`cardstack` auf denselben
  Player-Dokumentpfad — zwei Services für dasselbe Feld, siehe Befund 8).
- `to-json.service.ts` → Klasse `ToJSONService` (Groß-JSON in der Mitte) — unüblicher
  Schreibstil im Vergleich zu den übrigen PascalCase-Klassennamen, aber untergeordnet.

**Vorschlag (nice-to-have):** `DiebServiceService` → `DiebService` umbenennen (Datei
entsprechend `dieb.service.ts`). Größere Umbenennungen (Deutsch/Englisch-Vereinheitlichung)
laut CLAUDE.md nur nach expliziter Beauftragung.

### 8. Überlappende/unklare Verantwortung zwischen `SaveGameService`, `GamePlayerService`, `LoadGameService`, `CurrentGameService`

**Betroffene Dateien:** `save-game.service.ts`, `game-player.service.ts`, `load-game.service.ts`,
`current-game.service.ts`

**Problem:** Vier Services lesen/schreiben denselben Dokumentpfad `games/{gameId}` bzw.
`games/{gameId}/player/{playerId}`, mit sich überschneidenden Zuständigkeiten:
- `SaveGameService.updateHandstack`/`updateCardstack` (Z.13-27) und
  `GamePlayerService.updatePlayerCards` (Z.39-41) schreiben beide `handstack`/`cardstack` auf
  denselben Player-Dokumentpfad — nur dass `GamePlayerService` beide Felder in einem Write
  zusammenfasst (kein Diamond-Problem bei parallelen Writes) und `SaveGameService` sie in zwei
  separate `updateDoc`-Aufrufe aufteilt (zwei Roundtrips statt einem, siehe auch Befund 6, wo
  genau dieses Muster in der Schleife multipliziert wird).
- `GamePlayerService.getGame()` (Z.15-18) und `CurrentGameService.getCurrentGame()` (Z.18-25)
  tun exakt dasselbe (`getDoc(doc(db,'games',gameId))` → `.data()` zurückgeben) — zwei Services,
  eine Operation. Recherche über den gesamten Komponenten-Code (`grep -r CurrentGameService
  src/app`) zeigt: **`CurrentGameService` wird außerhalb seiner eigenen `.spec.ts` nirgends
  mehr injiziert oder aufgerufen** — vollständig toter Code.
- `LoadGameService` wird zusätzlich in `player-hand.component.ts:42` importiert und im
  Konstruktor **nicht** injiziert (kein `private loadGame: LoadGameService` im Constructor,
  Z.104-108) — der Import ist ungenutzt. Stattdessen baut `PlayerHandComponent` seine
  Firestore-Zugriffe für `games`-Collection direkt selbst (`db = getFirestore()` Z.93,
  `collection(this.db, 'games', ...)`/`doc(this.db, ...)` an mehreren Stellen, u.a. Z.109, 114,
  119, 184, 223) statt über `LoadGameService` oder `GamePlayerService` — die Abstraktion
  existiert, wird aber am größten Verbraucher (`PlayerHandComponent`, >500 Zeilen laut
  `docs/done/onpush-refactor-plan.md`) umgangen. Nur `SaveGameService` wird dort tatsächlich für
  Schreibzugriffe genutzt (Injection Z.106); Lesezugriffe laufen komplett am Service-Layer
  vorbei.

**Vorschlag (kritisch, größter Hebel dieses Reviews):**
1. `CurrentGameService` löschen (toter Code, keine Referenzen außerhalb der eigenen Spec).
2. `LoadGameService`-Import in `PlayerHandComponent` entweder tatsächlich nutzen oder entfernen
   (Komponentendetails gehören ins Komponenten-Review, aber der Fund gehört hierher, weil er
   zeigt, dass `LoadGameService` seinen Zweck als Abstraktionsschicht aktuell nicht erfüllt).
3. Mittelfristig `SaveGameService`, `LoadGameService` und `GamePlayerService` auf den in
   `docs/done/onpush-refactor-plan.md` referenzierten `GamePlayerService`-Ansatz konsolidieren
   (dort bereits als Vorbild genannt, Referenz PR #18/Issue #8): ein Service pro Aggregat
   (`GameRepositoryService` für `games/{gameId}`, `PlayerRepositoryService` für
   `games/{gameId}/player/{playerId}`), aufbauend auf dem generischen
   `FirestoreRepositoryService` aus Befund 1/2, statt drei/vier Services mit sich
   überschneidenden Lese-/Schreibmethoden für denselben Firestore-Baum.

### 9. Fehlende Typisierung / `any`

**Betroffene Dateien:** `current-game.service.ts:13` (`db: any`), `current-user.service.ts:20`
(`currentUserHero: Object = {}` — `Object` statt einem konkreten Typ oder zumindest
`unknown`/`Record<string,unknown>`), `current-user.service.ts:29` (Rückgabetyp
`Promise<any>`), `load-game.service.ts:43,50,57` (`docSnap.data()!['currentEnemy']` — Zugriff
auf ungetyptes `DocumentData` ohne Konvertierungsschicht/Typ-Guard, gibt implizit `any` an den
Aufrufer weiter), `game-player.service.ts:31,35` (`choosenHeros: unknown[]`,
`choosenHero: unknown` — immerhin `unknown` statt `any`, aber ohne konkretes Modell aus
`src/models/` bleibt der Aufrufer gezwungen, selbst zu casten)

**Vorschlag (nice-to-have, aber mit Sicherheitsbezug):** `DocumentData`-Zugriffe über
Konverter-Funktionen/`FirestoreDataConverter<T>` (Firestore-SDK-Feature) auf die vorhandenen
Modell-Klassen (`src/models/game.ts`, `src/models/monster/monster.class.ts`) abbilden, statt
String-Keys (`data['currentEnemy']`) verstreut über die Services zu wiederholen. Das würde auch
Tippfehler in Feldnamen (aktuell nur zur Laufzeit sichtbar) zu Compile-Zeit-Fehlern machen.

### 10. Tests prüfen kein Verhalten

**Betroffene Dateien:** alle sieben `.spec.ts`-Dateien; `dieb-service.service.spec.ts` **fehlt
komplett** (kein Test für `DiebServiceService` vorhanden, weder generiert noch echt).

**Problem:** Jede vorhandene `.spec.ts` prüft ausschließlich `expect(service).toBeTruthy()`.
Keine der elementaren Duplikate/Bugs aus diesem Review (identische Methoden, ungeprüfte
Promises, Race Condition in `LoadGameService`, Schleifen-Redundanz in `DiebServiceService`)
wäre durch die bestehende Suite aufgefallen oder würde durch einen Regressions-Test
abgesichert, sobald behoben.

**Vorschlag (wichtig, vor einem Refactoring dieser Services sinnvoll):** Für die in Befund 1/2/6
vorgeschlagenen Konsolidierungen zumindest Verhaltens-Tests mit Firestore-Emulator (Muster ist
bereits vorhanden: `ensureFirebaseTestAppInitialized()`/`ensureAngularFireSchedulersInitialized()`
aus `src/testing/firebase-test-app`, wird schon in `game-player.service.spec.ts`,
`load-game.service.spec.ts`, `save-game.service.spec.ts` importiert, aber nicht für echte
Assertions genutzt) ergänzen, bevor Methoden zusammengelegt werden — sonst lässt sich ein
Verhaltensunterschied zwischen z.B. `updateNewEnemy` und `updateCurrentEnemyToken` (falls doch
einer beabsichtigt war) nicht ausschließen.

## Priorisierte Empfehlungen

**Kritisch**
1. Generischen `FirestoreRepositoryService` (Befund 1) einführen und `SaveGameService`/
   `LoadGameService` darauf umstellen — löst Duplikate UND fehlendes Error-Handling in einem
   Schritt.
2. `SaveGameService`-Methoden `async`/`await` machen (Befund 4) — aktuell werden Schreibfehler
   systemweit verschluckt.
3. Toten Code entfernen: `CurrentGameService` löschen, `LoadGameService`-Geisterimport in
   `PlayerHandComponent` auflösen (Befund 8).
4. `loadNewEnemy`/`loadNewMob` und `updateCurrentEnemyToken`/`updateNewEnemy`
   zusammenlegen (Befund 1, 2) — inklusive Race-Condition-Fix in `LoadGameService`
   (`collectionData`-Instanzfeld entfernen).

**Wichtig**
5. `DiebServiceService.heropower()` von Firestore-Writes-in-der-Schleife auf einen Write am Ende
   umstellen (Befund 6).
6. `Firestore` per DI statt `getFirestore()`/`initializeApp()` in jedem Service (Befund 3).
7. Mittelfristige Konsolidierung `SaveGameService`/`LoadGameService`/`GamePlayerService` zu
   klar getrennten Repository-Services pro Aggregat (Befund 8), analog zum in
   `docs/done/onpush-refactor-plan.md` referenzierten `GamePlayerService`-Vorbild.
8. Test für `DiebServiceService` nachziehen (fehlt komplett), Verhaltens-Tests statt
   "should create" für die Firestore-Services vor der Konsolidierung (Befund 10).

**Nice-to-have**
9. `console.warn`-Reste entfernen (Befund 5).
10. `DiebServiceService` → `DiebService` umbenennen (Befund 7).
11. `any`/`Object`/String-Key-Zugriffe auf `DocumentData` durch typisierte Converter ersetzen
    (Befund 9).
