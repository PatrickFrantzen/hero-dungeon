# Plan: Login-Einstieg, Multiplayer-Beitritt und In-Game-Menü neu strukturieren

## Status (2026-09-04)

**PR 1 umgesetzt** (Issue #73, TDD, 4 Commits): `startscreen`-Route ohne `redirectUnauthorizedTo`;
neue Route `local-game/:id` ohne Guard; `LocalSingleplayerSaveService` (CRUD über LocalStorage);
`LocalGameDocumentStoreService` + `FirestoreRepositoryService`-Umschaltpunkt (`local-`-Präfix in
der gameId, siehe `local-game-id.util.ts`) — `GameRepositoryService`/`PlayerRepositoryService`
und damit `CardPlayService`/`GameComponent` brauchen dafür **keine** eigene Fallunterscheidung;
`PlayerHandComponent` überspringt für lokale Spiele das Firestore-Live-Sync, lädt einen
fortgesetzten Save aber einmalig nach (`loadLocalGameOnce()`); Startscreen-Sektion "Meine
Spielstände" (Fortsetzen per Klick). Per Playwright-Smoke-Test verifiziert: Startscreen → Held
wählen → Handkarten sichtbar → Reload auf `/local-game/:id` bleibt ohne Redirect und lädt
Handkarten erneut → Save erscheint in "Meine Spielstände" — alles ohne jede Anmeldung.

**PR 2 umgesetzt** (Issue #74, TDD): `GameMenuComponent` (`components/game-menu/CLAUDE.md`),
permanent sichtbar in `game.component.html`. Singleplayer: "Speichern" (reine Bestätigung, kein
Extra-Write — jede Aktion persistiert bereits synchron), "Spielstände laden" (identische Liste
wie Startscreen), "Verlassen". Multiplayer: nur "Verlassen" + Hinweistext "Automatisch
gespeichert". Per Playwright verifiziert: Menü öffnet während laufendem Spiel, Speichern-Klick
zeigt Bestätigung, Reload behält denselben Stand.

**PR 3 umgesetzt** (Issue #75, TDD): `DialogAccountOfferComponent` (`components/CLAUDE.md`,
Abschnitt Dialoge) öffnet sich automatisch, sobald ein lokales Singleplayer-Spiel ohne Account
nach `'won'`/`'lost'` wechselt (`GameComponent.offerAccountCreationOnGameEnd()`,
`game/CLAUDE.md`). Führt Registrierung (`AuthFormService.register()`) und Migration
(`LocalSaveMigrationService.migrateAll()` — alle vorhandenen lokalen Saves, je eigene neue
Firestore-gameId) selbst aus; lokale Saves bleiben nach erfolgreicher Migration zusätzlich
bestehen (keine Löschung). Ablehnen ("Nicht jetzt") schließt ohne Nebenwirkung, die Frage
erscheint bei der nächsten Transition nach `'won'`/`'lost'` erneut. Per Playwright verifiziert
(nur der Firebase-freie Teil — der eigentliche Registrierungs-Klick wurde bewusst **nicht**
automatisiert getestet, da diese Sandbox dieselbe Firebase-Instanz wie Prod nutzt und ein echter
Registrierungsversuch reale Nutzerdaten anlegen würde): Dialog öffnet automatisch bei
`gameStatus: 'won'`, "Nicht jetzt" schließt ihn und lässt den lokalen Save unverändert. Der volle
Pfad „Account erstellen → Spielstand erscheint identisch nach Login" aus der ursprünglichen
Verifikation dieses PRs steht weiterhin aus (wie schon bei anderen Multiplayer-/Firebase-Tests in
diesem Repo vermerkt) — vor dem Merge oder zumindest vor einem Produktiv-Rollout nachholen.

Damit ist der Singleplayer-Teil dieses Plans (PR 1–3) vollständig umgesetzt.

**PR 4 umgesetzt** (Issue #76, TDD): `StartscreenComponent.newGame()`/`joinGame()` rufen vor dem
eigentlichen Firestore-Zugriff `AuthFormService.ensureAnonymousSession()` auf (`signInAnonymously()`,
nur falls `auth.currentUser` noch leer ist) — `newSingleplayerGame()` bleibt bewusst ohne diesen
Aufruf. `src/models/user.class.ts`: `userEmail` ist jetzt optional (`toJSON()` lässt das Feld
komplett weg statt `undefined` zu schreiben — Firestore lehnt das ab), neues Feld
`lastActivityAt: Timestamp | FieldValue | null`. `GameRepositoryService`/`PlayerRepositoryService`
schreiben `lastActivityAt: serverTimestamp()` bei jedem Schreibzugriff auf `games/{gameId}` bzw.
`games/{gameId}/player/{playerId}` mit — mit einer bewussten Ausnahme vom sonst gültigen "keine
eigene lokal/Firestore-Fallunterscheidung in dieser Klasse"-Prinzip (`services/CLAUDE.md`): ein
`isLocalGameId(gameId)`-Guard verhindert, dass ein Firestore-`serverTimestamp()`-Sentinel in
einen lokalen Singleplayer-Spielstand (LocalStorage) geschrieben wird. `CurrentUserService`/
`AuthFormService` mussten für "anonyme Nutzer ohne E-Mail" nicht geändert werden — der bestehende
`?? 'Gast'`-Fallback in `CurrentUserService.getCurrentUser()` griff bereits, da nichts im Code
`userEmail` liest. `app.routes.ts` unverändert: `redirectUnauthorizedTo` auf `game/:id` greift
jetzt effektiv nie mehr sichtbar, da `signInAnonymously()` aus `newGame()`/`joinGame()` bereits
vor der Navigation dorthin abgeschlossen ist. `users/{uid}.lastActivityAt` (für eine
TTL-Policy auf das Profil-Dokument selbst) ist bewusst **nicht** Teil dieses PRs — laut PR-5-
Abschnitt unten ist das noch eine offene Design-Frage. Manueller Multiplayer-Smoke-Test („Spiel
im Privatfenster erstellen/beitreten ohne vorheriges Formular") steht wie bei den übrigen
Multiplayer-Tests in diesem Repo noch aus (kein Firebase-Emulator/Browser-Setup in dieser
Session).

**PR 5 umgesetzt** (Issue #77, TDD) — mit einer externen Restarbeit, die dieses Repo nicht
selbst erledigen kann: die Design-Frage ist entschieden (TTL-Policy nur auf `users/{uid}` und
`games/{gameId}/player/{playerId}`, nicht auf das geteilte `games/{gameId}`-Dokument, siehe
`services/CLAUDE.md`), aber die eigentliche Firestore-TTL-Policy-Konfiguration (Firebase
Console/`gcloud`) ist **kein Code-Artefakt** und wurde in dieser Session mangels Firebase-
Console-Zugriff **nicht** vorgenommen — das muss Patrick einmalig nachholen (Details/Befehl in
`services/CLAUDE.md`). Code-seitig: `GameComponent.loadHandstack()` (`game/CLAUDE.md`) behandelt
ein fehlendes eigenes Spieler-Unterdokument (Rejoin nach TTL-Löschung) wie einen frischen
Beitritt. Diagnose ergab, dass `CardPlayService`s "alle Spieler"-Operationen bereits über
`FirestoreRepositoryService.queryAll()` live abfragen (ein TTL-gelöschtes Dokument taucht dort
einfach nicht mehr auf) und die Zielspieler-Methoden bereits durchgängig mit `data?.[...] ??
[]`-Fallbacks arbeiten — hier war keine Code-Änderung nötig. `firestore.rules.test.js`: neuer
Describe-Block simuliert ein TTL-gelöschtes Mitspieler-Dokument und bestätigt, dass die übrigen
Rules-Zugriffe (geteiltes Spieldokument, eigenes Spieler-Dokument) weiterhin funktionieren.

PR 6 (Account-Verknüpfung + "Meine Spiele") ist als Issue #78 weiterhin offen.

Zielbild mit Patrick abgestimmt und fixiert (2026-09-04) — kein Optionsvergleich mehr, sondern
eine konkrete Entscheidung mit nummerierten PRs. Diese Diagnose ergänzt zwei bestehende Pläne,
statt sie zu ersetzen:

- `docs/planned/singleplayer-mode-plan.md` behandelt den **Spielregel**-Umbau für Singleplayer
  (Deck-Cycling, Solo-Helden, Siegzustand). Die dort skizzierte "Variante B — echter
  Offline/Local-Singleplayer" ist mit diesem Plan die **beschlossene Richtung** geworden (siehe
  Zielbild unten) — beim nächsten Anfassen von `singleplayer-mode-plan.md` dessen "Offene
  Produktentscheidung"-Abschnitt entsprechend als entschieden markieren.
- `docs/done/dialog-auth-unification-plan.md` hat `AuthFormService` bereits geschaffen (Login/
  Register + Fehler-Mapping) — dieser Plan baut darauf auf, ersetzt ihn nicht.

## Diagnose — vier Perspektiven

### 1. Nutzer-Sicht: was wird erwartet, was passiert tatsächlich

- **Jede Route verlangt vollen Login, bevor überhaupt etwas vom Spiel sichtbar ist**
  (`src/app/app.routes.ts:10-13`): `startscreen` UND `game/:id` haben beide
  `redirectUnauthorizedTo(['signIn'])` — das gilt auch für den Singleplayer-Button, der gar
  keinen zweiten Spieler braucht.
- **Kein Gastzugang, keine Begründung für den Zwang**: `signin.component.html:6` ("Please log
  into your Account", Englisch inmitten einer sonst deutschen App).
- **Kein sichtbares In-Game-Menü während `currentGameStatus() === 'playing'`**
  (`src/app/components/game/game.component.html:56-58`): der einzige "Zurück"-Button
  (`backToStartscreen()`, `game.component.ts:231-233`) taucht nur in den Bestätigungs-States
  `bossDefeated`/`lost` auf. Mitten im Spiel hat der Nutzer keine Möglichkeit, kontrolliert
  aufzuhören.
- **"Speichern" ist unsichtbares Auto-Save, nicht kommuniziert**: jede Aktion schreibt sofort
  nach Firestore (`PlayerRepositoryService`/`GameRepositoryService`), der Nutzer bekommt davon
  aber nichts mit.
- **Multiplayer-Beitritt ist reines Abtippen einer Spiel-ID** (`startscreen.component.html:17-27`,
  `joinGame()` in `startscreen.component.ts:105-125`): kein Einladungslink, kein Teilen-Button.

### 2. Entwickler-Sicht: Architektur/State

- `@angular/fire/auth-guard` ist bereits die zentrale Steuerung (`app.routes.ts`).
- Firebase Auth unterstützt **Anonymous Auth** (`signInAnonymously`) nativ inkl. späterer
  Verknüpfung mit einem echten Account (`linkWithCredential`) ohne Datenverlust.
- `GameComponent`, `PlayerHandComponent`, `CardPlayService`, alle Repository-Services sind heute
  durchgängig auf Firestore ausgerichtet (siehe Diagnose in `singleplayer-mode-plan.md`) — der
  jetzt beschlossene lokale Singleplayer-Pfad braucht einen eigenständigen
  Persistenz-Service parallel dazu, kein Umbau der bestehenden Firestore-Services (die bleiben
  für Multiplayer unverändert zuständig).
- **Bewusst keine gemeinsame Persistenz-Abstraktion (z.B. `GameSessionPort`).** Die Spielregeln
  (`CardPlayService` & Co.) bleiben identisch für beide Modi — es ändert sich ausschließlich,
  wohin geschrieben wird: Singleplayer schreibt lokal (`LocalSingleplayerSaveService`),
  Multiplayer schreibt wie bisher nach Firestore (`GameRepositoryService`/
  `PlayerRepositoryService`). Ziel ist minimaler Wartungsaufwand — ein einziger Umschaltpunkt
  pro Schreibzugriff (z.B. per Modus-Flag/Injection Token), keine zwei parallel gepflegten
  Regel-Implementierungen.
- **Route-Frage ungeklärt:** `startscreen.component.ts:88/119` navigiert für Singleplayer und
  Multiplayer auf dieselbe Route `game/:id`, die laut `app.routes.ts:13` durchgängig
  `redirectUnauthorizedTo` trägt. Ohne Klärung dieser Route-Frage bleibt ein nicht eingeloggter
  Nutzer beim Singleplayer-Start weiterhin am Guard hängen — PR 1 muss das explizit lösen (siehe
  dort), nicht erst PR 4.
- Ein In-Game-Menü ist eine neue, klar abgegrenzte Komponente (analog zum bestehenden
  Container/Presenter-Muster aus `src/app/components/CLAUDE.md`).

### 3. Security-Sicht

- `firestore.rules:36` erlaubt jedem eingeloggten Nutzer (auch anonym) Lese-/Schreibzugriff auf
  `games/{gameId}` — bleibt für Multiplayer unverändert gültig, betrifft Singleplayer nach diesem
  Umbau gar nicht mehr, da Singleplayer keine Firestore-Schreibzugriffe mehr macht.
- `users/{userId}` (`firestore.rules:19-21`) bleibt strikt auf den eigenen Nutzer beschränkt.
  Für anonyme Multiplayer-Nutzer entsteht weiterhin ein `users/{uid}`-Dokument ohne E-Mail —
  `userEmail` muss im Modell optional werden.
- **Konto-Verknüpfung** ist an zwei unterschiedlichen Stellen sicherheitsrelevant, siehe Zielbild
  (Singleplayer: neue Registrierung + Datenmigration; Multiplayer: `linkWithCredential` auf
  bestehende `uid`) — in beiden Fällen darf ein Fehlschlag nicht zu Datenverlust führen.
- **TTL-Löschung anonymer Multiplayer-Daten** löscht nur Firestore-Dokumente, **nicht** den
  Firebase-Auth-User selbst (bewusste Entscheidung, siehe Zielbild) — das ist kein
  Sicherheitsrisiko (der verwaiste Auth-User hat ohne zugehörige Firestore-Daten keinen Zugriff
  auf irgendwas Sensibles mehr), aber die "Account-Leichen" existieren in der Firebase-Auth-
  Konsole weiter.

### 4. Datenquelle/Persistenz-Sicht

- Kein eigenes Backend, keine Cloud Functions — Firestore-Security-Rules sind die einzige
  Zugriffskontrolle für Multiplayer-Daten. Für die geplante TTL-Löschung heißt das: **Firestore
  TTL-Policies** (serverseitig über Firebase Console/`gcloud firestore fields ttls update`
  konfiguriert, kein eigener Scheduler/Cloud Function nötig) statt eines Cron-Jobs.
- Singleplayer bekommt mit diesem Plan erstmals eine **komplett eigene, lokale Datenquelle**
  (LocalStorage/IndexedDB) parallel zur bestehenden Firestore-Datenquelle für Multiplayer — zwei
  Persistenz-Pfade im selben Projekt, die bewusst getrennt bleiben (siehe Zielbild).

## Zielbild (fixiert, 2026-09-04)

### Start

Kein Login-Zwang mehr auf `startscreen` — direkter Einstieg mit den Optionen Singleplayer,
Multiplayer, Tutorial, Beenden.

### Singleplayer — lokal, mehrere parallele Spielstände

- Läuft komplett ohne Firestore/Auth: eigener lokaler Persistenz-Service
  (LocalStorage/IndexedDB), der pro Spielstand den kompletten Zustand hält (Held, Hand-/
  Nachzieh-/Ablagestapel, aktueller Encounter, Timer-Felder, `GameStats`, `gameStatus` — dasselbe
  Datenmodell, das heute nach `games/{gameId}` bzw. `games/{gameId}/player/{playerId}`
  geschrieben wird, nur lokal statt in Firestore serialisiert).
- **Mehrere parallele lokale Spielstände** sind möglich — Startscreen bekommt eine Übersicht
  "Meine Spielstände" (neue Liste, aus dem lokalen Speicher gelesen), aus der ein Spielstand
  fortgesetzt oder ein neuer begonnen werden kann.
- Ohne Account bleibt der Fortschritt einfach lokal bestehen und nutzbar — kein Zwang, keine
  Löschung, keine Wiedervorlage außer beim nächsten Spielende (siehe unten).
- **Beim Spielende** (Sieg oder Niederlage, nicht bei jedem "Menü → Verlassen" zwischendurch)
  wird angeboten, einen Account zu erstellen, damit der Spielstand künftig online gespeichert
  wird. Das ist eine **neue Registrierung** (kein anonymer Account existiert im Singleplayer-Pfad
  vorher) über das bestehende `AuthFormService.register()`. Nach erfolgreicher Registrierung wird
  der lokale Spielstand (mindestens der gerade beendete, im Idealfall alle vorhandenen lokalen
  Spielstände) einmalig nach Firestore migriert.
- Lehnt der Nutzer ab, bleibt der lokale Spielstand unverändert nutzbar; die Frage erscheint beim
  nächsten Spielende erneut.

### Multiplayer — anonym startbar, mit Ablaufdatum

- Beitritt/Erstellung eines Multiplayer-Spiels löst `signInAnonymously()` aus (nicht global beim
  App-Start — Singleplayer und Tutorial brauchen weiterhin gar keinen Auth-Aufruf). Der Nutzer
  bekommt dabei seine Firebase-`uid` als Identität, mit der er anderen beitreten/von anderen
  gefunden werden kann.
- `users/{uid}` bekommt ein `lastActivityAt`-Feld, das bei jeder relevanten Spielaktion
  aktualisiert wird (Analog zu den bestehenden Repository-Writes). **Muss als Firestore
  `Timestamp` (`serverTimestamp()`) geschrieben werden, nicht als `number`/Epoch** — Firestore-
  TTL-Policies greifen ausschließlich auf Felder vom Typ `Timestamp`; ein numerischer Wert wird
  von der TTL-Engine stillschweigend ignoriert, ohne dass das im Emulator auffällt (der prüft TTL
  nicht).
- **7 Tage nach der letzten Aktivität** (nicht ab Erstellung) werden die Firestore-Daten eines
  anonymen Accounts über eine Firestore-TTL-Policy auf `lastActivityAt` automatisch gelöscht. Der
  zugehörige Firebase-Auth-User selbst wird **nicht** aktiv gelöscht — bewusst in Kauf genommene
  "Account-Leiche" ohne Datenzugriff, um keinen Scheduler/Cloud Function für diesen Fall
  einzuführen.
- Andere Mitspieler eines Spiels, dessen anonymer Mitspieler gelöscht wurde, spielen ohne ihn
  weiter — das erfordert, dass `GameComponent`/`CardPlayService`/`PlayerHandComponent` einen
  fehlenden Mitspieler-Datensatz vertragen, statt davon auszugehen, dass jeder in `choosenHeros`
  gelistete Spieler auch weiterhin ein lesbares `games/{gameId}/player/{playerId}`-Dokument hat.
- **Mit Login bleibt der Spielstand dauerhaft erhalten** — Verknüpfung des bestehenden anonymen
  Accounts mit E-Mail/Passwort via `linkWithCredential` (gleiche `uid`, kein Datenverlust, keine
  Migration nötig, da bereits in Firestore).
- Zusätzlich bekommt jeder Account (anonym oder dauerhaft) eine einfache **Spiel-Historie**:
  `users/{uid}` merkt sich die IDs der Multiplayer-Spiele, denen der Account beigetreten ist. Das
  Startscreen/In-Game-Menü zeigt daraus "Meine Spiele" als klickbare Liste, sodass ein
  bestehendes Spiel ohne erneute manuelle ID-Eingabe fortgesetzt werden kann — funktioniert für
  anonyme Accounts nur innerhalb der 7-Tage-Frist, für verknüpfte Accounts dauerhaft. Es ist
  bewusst **keine** echte Freundesliste (kein Online-Status, keine Einladungen über die App) —
  nur eine an den Account gebundene Spiel-Historie, analog zu "zuletzt gespielt".
- Es ist zu einem Zeitpunkt jeweils **ein aktives Multiplayer-Spiel** relevant — keine
  Mehrfachverwaltung parallel laufender Multiplayer-Partien wie bei den lokalen
  Singleplayer-Spielständen.

### In-Game-Menü — für beide Modi, unterschiedlich befüllt

Neue Komponente `GameMenuComponent`, permanent erreichbar (unabhängig von `currentGameStatus()`):

- **Fortsetzen** (Menü schließen).
- **Speichern** — für Singleplayer ein expliziter Trigger auf den lokalen Persistenz-Service
  (zusätzlich zum ohnehin laufenden Auto-Save nach jeder Aktion); für Multiplayer reiner
  Kommunikations-Hinweis ("automatisch gespeichert"), da Firestore-Auto-Save dort unverändert
  bleibt.
- **Spielstände laden** — für Singleplayer die Liste der lokalen Spielstände (dieselbe wie auf
  dem Startscreen); für Multiplayer die "Meine Spiele"-Liste aus dem Zielbild oben.
- **Verlassen** — navigiert zu `/startscreen`.
- **Spiel-ID/Einladungslink anzeigen** (nur Multiplayer) — macht erneutes Einladen weiterer
  Mitspieler mitten im Spiel möglich.
- **Logout** (nur wenn ein Account existiert) — verschiebt den bestehenden `logout()` aus
  `StartscreenComponent` (`startscreen.component.ts:98-103`) zusätzlich hierher.
- Bewusst **kein** "Spiel löschen"/"Spiel abbrechen für alle" — würde andere Mitspieler betreffen
  und bräuchte eine eigene Diagnose (Konsens/Berechtigung), nicht Teil dieses Plans.

## Empfohlener Schnitt (PRs)

### PR 1 — Startscreen ohne Login-Zwang + lokaler Singleplayer-Persistenz-Service

- `app.routes.ts`: `redirectUnauthorizedTo` von der `startscreen`-Route entfernen.
- Neuer `LocalSingleplayerSaveService` (LocalStorage/IndexedDB): CRUD für Spielstände, ein
  Spielstand = derselbe Datenumfang wie heute `games/{gameId}` + zugehöriges Player-Dokument.
- Singleplayer-Pfad in `GameComponent`/`CardPlayService`/`PlayerHandComponent` auf diesen Service
  umstellen statt auf `GameRepositoryService`/`PlayerRepositoryService` (baut auf den fachlichen
  TODOs aus `docs/planned/singleplayer-mode-plan.md` auf, liefert hier den Persistenz-Unterbau).
  Kein Duplizieren der Spielregeln: `CardPlayService` bekommt einen einzigen Umschaltpunkt
  (Modus-Flag o.ä.), der pro Schreibzugriff entscheidet, ob lokal oder nach Firestore geschrieben
  wird — die Regellogik selbst bleibt für beide Modi ein Codepfad.
- Neue Startscreen-Komponente/-Sektion "Meine Spielstände" (Liste lokaler Saves, Fortsetzen/Neu).
- **Route-Korrektur (behebt Widerspruch zur eigenen Verifikation weiter unten):** Singleplayer
  navigiert aktuell auf dieselbe Route `game/:id` wie Multiplayer (`startscreen.component.ts:88/
  119`), die durchgängig `redirectUnauthorizedTo` trägt (`app.routes.ts:13`) — ohne Änderung
  bliebe ein nicht eingeloggter Nutzer beim Singleplayer-Start am Guard hängen, obwohl PR 1
  genau das beheben soll. Lösung in diesem PR: eigene Route `local-game/:id` ohne Guard für den
  Singleplayer-Pfad (Multiplayer bleibt vorerst unverändert auf `game/:id` mit
  `redirectUnauthorizedTo`, wird erst in PR 4 durch die Anonymous-Auth-Logik ersetzt).
- Verifikation: `ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI`, manueller Test
  „App im Privatfenster öffnen → Singleplayer direkt spielbar ohne jede Anmeldung, inkl. Wechsel
  auf die Spielansicht selbst (nicht nur Startscreen)", „zwei lokale Spielstände parallel
  anlegen, beide unabhängig fortsetzbar".

### PR 2 — In-Game-Menü (Grundgerüst)

- `GameMenuComponent` erstellen (Presenter: Button + aufklappbares Menü), eingebunden in
  `game.component.html`, permanent sichtbar.
- Singleplayer: "Speichern" (expliziter Trigger auf `LocalSingleplayerSaveService`), "Spielstände
  laden" (Liste), "Verlassen".
- Multiplayer: vorerst nur "Verlassen" + Auto-Save-Hinweistext (Spiel-ID/Einladungslink/"Meine
  Spiele" folgen in PR 4/6, da sie auf der Anonymous-Auth-Infrastruktur aufbauen).
- Verifikation: `ng build`, `ng test`, manueller Test „Menü öffnen während laufendem Singleplayer-
  Spiel", „expliziter Speichern-Klick + Neuladen der Seite stellt denselben Stand wieder her".

### PR 3 — Singleplayer-Ende: Account-Angebot + Migration

- Bei `gameStatus === 'won' | 'lost'` (oder im entsprechenden Sieg/Niederlage-Bestätigungs-Flow)
  Dialog "Account erstellen, um diesen Spielstand online zu sichern" mit bestehendem
  `AuthFormService.register()`.
- Nach Erfolg: einmalige Migration des/der lokalen Spielstände nach Firestore
  (`games/{gameId}` + Player-Dokument je Save, neue `gameId` pro migriertem Save).
  Fehlschlag der Migration darf den lokalen Spielstand nicht löschen (lokal bleibt zusätzlich
  bestehen, bis Migration nachweislich erfolgreich war).
- Ablehnen schließt den Dialog ohne Nebenwirkung; Frage erscheint beim nächsten Spielende erneut
  (kein "nicht mehr fragen"-Flag in diesem Plan vorgesehen).
- Verifikation: `ng build`, `ng test`, manueller Test „Singleplayer bis Sieg/Niederlage spielen →
  Account erstellen → Spielstand erscheint identisch nach Login auf `/game/{migrierteId}`",
  „Ablehnen lässt lokalen Spielstand unverändert nutzbar".

### PR 4 — Anonymous Auth für Multiplayer-Einstieg

- `newGame()`/`joinGame()` in `StartscreenComponent`: vor dem eigentlichen Firestore-Zugriff
  `signInAnonymously()`, falls noch kein Nutzer eingeloggt ist.
- `src/models/user.class.ts`: `userEmail` optional; `lastActivityAt: Timestamp` (Firestore
  `Timestamp`, nicht `number`/Epoch — siehe Diagnose Abschnitt 2) neu ergänzen.
- `CurrentUserService`/`AuthFormService`: anonyme Nutzer ohne E-Mail vertragen (Anzeige-Fallback
  für den Nicknamen, kein Crash bei fehlendem `userEmail`).
- `game/:id`-Route: `redirectUnauthorizedTo` bleibt, verweist aber jetzt implizit auf den
  Anonymous-Auth-Flow (kein sichtbarer Signin-Screen mehr nötig, da `signInAnonymously()` aus
  `newGame()`/`joinGame()` bereits vorher greift).
- `GameRepositoryService`/`PlayerRepositoryService`: `lastActivityAt` bei jedem relevanten
  Schreibzugriff mitschreiben.
- Verifikation: `ng build`, `ng test`, `npm run test:rules`, manueller Test „Multiplayer-Spiel im
  Privatfenster erstellen/beitreten, ohne vorher ein Formular auszufüllen".

### PR 5 — 7-Tage-TTL für anonyme Multiplayer-Daten + Ausfalltoleranz

- **Offene Design-Frage vor der Umsetzung klären:** `lastActivityAt` muss laut PR 4 sowohl auf
  `users/{uid}` als auch bei Schreibzugriffen über `GameRepositoryService`/
  `PlayerRepositoryService` gepflegt werden — das sind **drei verschiedene Collection-Groups**
  (`users`, `games`, `games/*/player`), von denen jede ihre eigene TTL-Policy braucht
  (TTL-Policies werden pro Collection-Group konfiguriert, nicht global). Zusätzlich ist
  `games/{gameId}` ein von mehreren Spielern **geteiltes** Dokument: welcher Spieler-Aktivität
  sein `lastActivityAt` folgt, ist zu klären, bevor die Policy konfiguriert wird — sonst droht,
  dass das komplette Game-Dokument gelöscht wird, während ein anderer Mitspieler noch aktiv
  spielt (nicht nur der Einzelfall "ein Mitspieler-Dokument fehlt", den der nächste Punkt
  adressiert). Empfehlung: TTL-Policy nur auf `users/{uid}` und `games/{gameId}/player/{playerId}`
  (je eigenes `lastActivityAt`), **nicht** auf das geteilte `games/{gameId}`-Dokument selbst —
  das bleibt bestehen, solange mindestens ein Spieler-Unterdokument existiert.
- Firestore-TTL-Policy(s) auf `lastActivityAt` konfigurieren (Firebase Console/`gcloud`, kein
  Code-Artefakt im Repo außer einer Dokumentation der Policy in `firestore.rules`-Kommentar oder
  `services/CLAUDE.md`, da TTL-Policies nicht Teil der Security Rules selbst sind).
- `GameComponent.checkIfPlayerIsAlreadyPartOfGame()`/`CardPlayService`: robust gegen ein
  gelöschtes `games/{gameId}/player/{playerId}`-Dokument eines Mitspielers machen — Gruppe muss
  ohne diesen Spieler weiterspielen können, statt beim Zugriff auf sein Dokument zu scheitern.
- `firestore.rules.test.js`: Test ergänzen, der ein Spiel mit einem "verschwundenen" Spieler-
  Dokument simuliert und prüft, dass die übrigen Rules-Zugriffe weiterhin funktionieren.
- Dokumentation in `services/CLAUDE.md`: TTL-Policy-Konfiguration + bewusst nicht gelöschte
  Firebase-Auth-User als bekannte Einschränkung festhalten.
- Verifikation: `npm run test:rules`, manueller/simulierter Test „Spielerdokument manuell im
  Emulator löschen → verbleibende Spieler können weiterspielen, keine Exception".

### PR 6 — Account-Verknüpfung Multiplayer + "Meine Spiele"-Liste

- `AuthFormService`: neue Methode `linkAnonymousAccount(email, password, nickname)` via
  `linkWithCredential`/`EmailAuthProvider.credential(...)` für bereits anonym eingeloggte Nutzer
  — gleiche `uid`, kein Migrationsschritt nötig (im Unterschied zu PR 3, wo eine neue `uid` durch
  Registrierung entsteht).
- `users/{uid}`: Liste der beigetretenen Spiele (`games: string[]` oder eigene Subcollection),
  aktualisiert in `newGame()`/`joinGame()`.
- Startscreen + `GameMenuComponent`: "Meine Spiele"-Liste statt/ergänzend zur manuellen
  ID-Eingabe.
- Fehlerfall bei der Verknüpfung (z. B. E-Mail bereits vergeben) darf den bestehenden anonymen
  Account nicht invalidieren — Nutzer bleibt als Gast weiter spielfähig.
- Verifikation: `ng build`, `ng test`, `npm run test:rules`, manueller Test „anonym Multiplayer
  spielen → Account verknüpfen → Spiel erscheint in 'Meine Spiele' nach Login auf zweitem
  Gerät/Browser", „Verknüpfung mit bereits vergebener E-Mail zeigt Fehler, Gast-Session bleibt
  nutzbar".

## Verifikation (gesamter Plan)

- Jeder PR einzeln: `ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI`,
  `npm run test:rules` falls Firestore-Rules/TTL betroffen sind (PR 4, PR 5, PR 6).
- Manueller End-to-End-Test vor Merge von PR 3/6: kompletter Pfad „lokal Singleplayer spielen →
  Account erstellen → Spielstand online sichtbar" bzw. „anonym Multiplayer spielen → Account
  verknüpfen → Spiel auf zweitem Gerät fortsetzbar" — bislang in keiner Session mit laufendem
  Firebase-Emulator/Browser-Setup durchführbar (wie bereits in
  `docs/done/dialog-auth-unification-plan.md` und `docs/planned/singleplayer-mode-plan.md`
  vermerkt) — vor dem jeweiligen Merge nachholen.
- Vor Merge von PR 5: manueller/simulierter Test, dass eine laufende Multiplayer-Gruppe einen
  wegen TTL-Ablauf verschwundenen Mitspieler nicht als Absturz erlebt.

## Nicht im Scope

- Echte Freundesliste (Online-Status, In-App-Einladungen) — "Meine Spiele" ist bewusst nur eine
  einfache, an den Account gebundene Historie, siehe Zielbild.
- "Spiel löschen/abbrechen"-Funktion im Menü — beträfe andere Mitspieler, eigene Diagnose nötig.
- Deutsch/Englisch-Vereinheitlichung der Texte über das für diesen Plan Nötige hinaus — laut
  Root-`CLAUDE.md` nicht ohne expliziten Auftrag anfassen.
- Passwort-Reset-Flow, Social-Login (Google/Apple) — nicht Teil der genannten Probleme.
- Einladungslink mit Query-Param (`?join=<gameId>`) für die "Spiel-ID anzeigen"-Funktion im Menü
  — die "Meine Spiele"-Liste aus PR 6 deckt den ursprünglich genannten Use-Case ("Freunde ohne
  ID-Eingabe wiederfinden") bereits für Accounts ab; ein zusätzlicher, öffentlich teilbarer Link
  für Erstkontakte (der die `games/{gameId}`-Rules-Frage aus der vorherigen Fassung dieses Plans
  aufwirft) ist eine mögliche spätere Erweiterung, aber nicht Teil dieses Plans.

## Referenzen

- `docs/planned/singleplayer-mode-plan.md` — Spielregel-Umbau Singleplayer; dessen Variante B
  ist mit diesem Plan die beschlossene Richtung.
- `docs/done/dialog-auth-unification-plan.md` — `AuthFormService`-Grundlage, auf der PR 3/6 hier
  aufbauen.
- `src/app/services/CLAUDE.md` — bestehender Firestore-Auto-Save-Mechanismus (Repository-
  Services), der für Multiplayer unverändert bleibt und für Singleplayer durch den neuen
  `LocalSingleplayerSaveService` ersetzt wird.
- `firestore.rules` — Kommentar zu `games/{gameId}`-Zugriff, weiterhin relevant für den
  Multiplayer-Pfad (PR 4-6).
