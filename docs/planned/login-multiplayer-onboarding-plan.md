# Plan: Login-Einstieg, Multiplayer-Beitritt und In-Game-Menü neu strukturieren

## Status (2026-09-04)

Neuer Plan, noch nicht umgesetzt. Ausgangspunkt: Patricks Beobachtung, dass sich der
Pflicht-Login vor jedem Spiel (auch Singleplayer) falsch anfühlt und im laufenden Spiel kein
Menü existiert, um zu speichern/aufzuhören. Diese Diagnose ergänzt zwei bestehende Pläne, statt
sie zu ersetzen:

- `docs/planned/singleplayer-mode-plan.md` behandelt den **Spielregel**-Umbau für Singleplayer
  (Deck-Cycling, Solo-Helden, Siegzustand) — geht aber nicht auf die Login-Pflicht *davor* ein.
  Variante B dort ("echter Offline/Local-Singleplayer") überschneidet sich mit Option B unten.
- `docs/done/dialog-auth-unification-plan.md` hat `AuthFormService` bereits geschaffen (Login/
  Register + Fehler-Mapping) — dieser Plan baut darauf auf, ersetzt ihn nicht.

## Diagnose — vier Perspektiven

### 1. Nutzer-Sicht: was wird erwartet, was passiert tatsächlich

- **Jede Route verlangt vollen Login, bevor überhaupt etwas vom Spiel sichtbar ist**
  (`src/app/app.routes.ts:10-13`): `startscreen` UND `game/:id` haben beide
  `redirectUnauthorizedTo(['signIn'])` — das gilt auch für den Singleplayer-Button, der gar
  keinen zweiten Spieler braucht. Erwartung eines Casual-Users bei "Singleplayer starten": sofort
  spielen, wie bei den meisten Kartenspiel-Apps. Tatsächlich: E-Mail + Passwort registrieren,
  bevor überhaupt eine Karte sichtbar ist.
- **Kein Gastzugang, keine Begründung für den Zwang**: `signin.component.html:6` ("Please log
  into your Account", Englisch inmitten einer sonst deutschen App) erklärt nicht, wozu der
  Account gebraucht wird (Spielstand-Sync über Geräte? Multiplayer-Identität?). Aus Nutzersicht
  wirkt die Hürde unmotiviert, wenn direkt danach "Singleplayer" die erste Option ist.
- **Kein sichtbares In-Game-Menü während `currentGameStatus() === 'playing'`**
  (`src/app/components/game/game.component.html:56-58`): der einzige "Zurück"-Button
  (`backToStartscreen()`, `game.component.ts:231-233`) taucht nur in den Bestätigungs-States
  `bossDefeated`/`lost` auf (`game.component.html:32-40`, `:46-54`). Mitten im Spiel hat der
  Nutzer keine Möglichkeit, kontrolliert aufzuhören — nur Browser-Zurück oder Tab schließen,
  ohne zu wissen, ob/wo der Fortschritt landet.
- **"Speichern" ist unsichtbares Auto-Save, nicht kommuniziert**: jede Aktion schreibt sofort
  nach Firestore (`PlayerRepositoryService`/`GameRepositoryService`, siehe
  `src/app/services/CLAUDE.md`) — technisch geht also nichts verloren. Der Nutzer bekommt davon
  aber nichts mit: kein "Wird gespeichert…"-Hinweis, kein expliziter "Speichern & Beenden"-Punkt,
  keine Bestätigung beim Verlassen ("dein Fortschritt ist sicher"). Die Wahrnehmung "es gibt kein
  Speichern" ist ein reines Kommunikationsproblem, kein technisches — genau deshalb aber leicht
  behebbar.
- **Multiplayer-Beitritt ist reines Abtippen einer Spiel-ID** (`startscreen.component.html:17-27`,
  `joinGame()` in `startscreen.component.ts:105-125`): kein Einladungslink, kein QR-Code, kein
  Teilen-Button. Für "mit Freunden spielen" — der naheliegende Multiplayer-Use-Case — ist das
  hohe Reibung (ID muss über einen zweiten Kanal, z. B. Chat, kopiert werden).

### 2. Entwickler-Sicht: Architektur/State

- `@angular/fire/auth-guard` ist bereits die zentrale Steuerung (`app.routes.ts`) — eine
  Lockerung für Singleplayer betrifft nur die Guard-Konfiguration einer Route, kein größerer
  Umbau.
- Firebase Auth unterstützt **Anonymous Auth** (`signInAnonymously`) nativ inkl. späterer
  Verknüpfung mit einem echten Account (`linkWithCredential`) ohne Datenverlust — passt zum
  bestehenden `@angular/fire/auth`-Setup, ohne ein zweites Auth-System einzuführen.
- Ein In-Game-Menü ist eine neue, klar abgegrenzte Komponente (analog zum bestehenden
  Container/Presenter-Muster aus `src/app/components/CLAUDE.md`) — reiner UI-/Navigations-
  Zustand, kein neuer Store-Slice nötig, solange es nur öffnet/schließt und bestehende
  Aktionen (`logout()`, `backToStartscreen()`) bündelt.
- `GameComponent` ist aktuell nicht responsible für "aufhören" während `playing` — das Fehlen
  ist ein simples Template-/Komponenten-Gap (`game.component.html:56-58` zeigt currently nur
  `app-player-hand`), kein tieferes architektonisches Problem.
- `joinGameId` als reiner Text-Input (`startscreen.component.ts:28`) ließe sich um einen
  `?join=<gameId>`-Query-Param in der Route erweitern, den ein Einladungslink vorbefüllt — kleine
  Ergänzung zu `app.routes.ts` und `StartscreenComponent.ngOnInit()`.

### 3. Security-Sicht

- `firestore.rules:36` erlaubt **jedem eingeloggten Nutzer** Lese-/Schreibzugriff auf
  `games/{gameId}` (bewusste Entscheidung laut Kommentar dort, weil der Join-Flow das Dokument
  lesen muss, bevor der Client weiß, ob er schon Mitspieler ist) — das gilt unverändert für
  anonyme Nutzer, sobald die vorgeschlagene Anonymous-Auth kommt. Kein zusätzliches Risiko
  gegenüber heute, aber auch keine Verbesserung — sollte bei einem Einladungslink-Feature nicht
  implizit verschlimmert werden (z. B. wenn Game-IDs kurz/erratbar würden).
- `users/{userId}` (`firestore.rules:19-21`) ist strikt auf den eigenen Nutzer beschränkt — bei
  anonymen Accounts entsteht trotzdem ein `users/{uid}`-Dokument; `AuthFormService.register()`
  schreibt aktuell `userEmail` fest (`auth-form.service.ts:54`) — für anonyme Nutzer gibt es
  keine E-Mail, das Nutzer-Dokument (`src/models/user.class.ts`) muss ein leeres/optionales
  `userEmail` vertragen, ohne dass abhängiger Code (`CurrentUserService`, Anzeige des Nicknamens)
  bricht.
- **Konto-Verknüpfung** (anonym → E-Mail/Passwort) ist der sicherheitskritische Teil: schlägt sie
  fehl oder wird abgebrochen, darf kein Spielstand verloren gehen und kein doppeltes
  `users/{uid}`-Dokument entstehen — braucht einen expliziten Fehlerpfad, nicht nur den
  Optimistic-Case.
- Kein neues Risiko durch das In-Game-Menü selbst (reine Navigation/bestehende Actions) — die
  einzige neue sicherheitsrelevante Aktion wäre ein "Spiel endgültig löschen"-Punkt, falls dieser
  ergänzt wird (aktuell nicht vorgesehen, siehe Nicht-im-Scope unten).

### 4. Datenquelle/Persistenz-Sicht

- Kein eigenes Backend, keine Cloud Functions — Firestore-Security-Rules sind die einzige
  Zugriffskontrolle (siehe `firestore.rules`-Kommentar, Zeile 8-10). Jede Änderung an "wer wann
  was speichert" muss sich innerhalb dieses Modells bewegen, es gibt keine Server-Validierung
  dahinter.
- "Speichern" existiert bereits vollständig als Auto-Save bei jeder Spielaktion (siehe
  `src/app/services/CLAUDE.md`, Repository-Services) — ein "Speichern & Beenden"-Menüpunkt ist
  im Kern nur `backToStartscreen()` plus UI-Kommunikation, **kein** neuer Schreibpfad.
- Ein echter Offline-Singleplayer ohne Firestore (Variante B in
  `docs/planned/singleplayer-mode-plan.md`) würde diesen Auto-Save-Mechanismus für den
  Singleplayer-Pfad komplett ersetzen (LocalStorage o. ä.) — das ist ein separates, deutlich
  größeres Vorhaben und wird hier bewusst nicht verfolgt (siehe Zielbild-Optionen unten).

## Zielbild — drei Optionen (Entscheidung erforderlich, keine davon ist hier vorentschieden)

**Option A — Anonymous Auth als Standard-Einstieg (empfohlen als kleinster stimmiger Schritt)**
Beim ersten App-Start automatisch `signInAnonymously()`, kein Signin-Screen vor dem Startscreen.
Singleplayer und sogar ein spontanes Multiplayer-Spiel funktionieren sofort. Ein "Account
sichern"-Hinweis (z. B. im neuen In-Game-Menü oder auf dem Startscreen) bietet optional die
Verknüpfung mit E-Mail/Passwort an, für Spielstand-Zugriff von einem zweiten Gerät. Bleibt
architektonisch nah am Ist-Zustand (`@angular/fire/auth`, Firestore-Rules unverändert gültig),
größter Nutzen für den beschriebenen Reibungspunkt bei überschaubarem Umbau.

**Option B — Login bleibt Pflicht, aber nur für Multiplayer; Singleplayer ganz ohne Auth/Firestore**
Deckt sich mit Variante B aus `singleplayer-mode-plan.md`: Singleplayer läuft komplett lokal
(kein `games/{gameId}`-Dokument, kein Auth-Zwang), Multiplayer bleibt wie heute. Sauberste
Trennung aus Nutzersicht ("Singleplayer ist wirklich offline"), aber der mit Abstand größte
Umbau — `GameComponent`, `PlayerHandComponent`, `CardPlayService`, alle Repository-Services sind
heute durchgängig auf Firestore ausgerichtet (siehe Diagnose in `singleplayer-mode-plan.md`).

**Option C — Login bleibt wie heute, nur In-Game-Menü + Kommunikation verbessern**
Kein Auth-Umbau; nur die im nächsten Abschnitt beschriebene Menü-/Kommunikations-Verbesserung.
Löst das "kein Speichern/Aufhören"-Problem vollständig, lässt aber die als unpassend empfundene
Login-Pflicht vor dem Singleplayer unverändert bestehen.

**Empfehlung**: Option A + das In-Game-Menü (unten) zusammen — deckt beide von Patrick genannten
Punkte ab, ohne den großen Umbau aus Option B zu erzwingen. Option B bleibt als mögliche
Folge-Iteration bestehen, falls "wirklich offline" später gewünscht ist.

## In-Game-Menü — unabhängig von der Login-Entscheidung, in jedem Fall sinnvoll

Neue Komponente `GameMenuComponent` (Container/Presenter, analog `enemy/`/`heropower/` aus
`src/app/components/CLAUDE.md`), eingehängt in `game.component.html` als permanent erreichbarer
Button (z. B. oben neben `.game-timer`), unabhängig vom `currentGameStatus()`:

- **Fortsetzen** (Menü schließen, keine Aktion).
- **Spiel verlassen** — navigiert zu `/startscreen` (wie heutiges `backToStartscreen()`), mit
  Hinweistext "Dein Fortschritt ist automatisch gespeichert" statt eines echten
  Speichervorgangs — macht den bereits bestehenden Auto-Save für den Nutzer sichtbar.
- **Spiel-ID/Einladungslink anzeigen** (nur Multiplayer, `currentNumberOfPlayers() > 1`) — macht
  erneutes Einladen weiterer Mitspieler mitten im Spiel möglich, nicht nur beim Erstellen.
- **Logout** — verschiebt den bestehenden `logout()` aus `StartscreenComponent`
  (`startscreen.component.ts:98-103`) zusätzlich hierher, damit ein Nutzer nicht erst zum
  Startscreen zurück muss, um sich abzumelden.
- Bewusst **kein** "Spiel löschen"/"Spiel abbrechen für alle" — würde andere Mitspieler
  betreffen und bräuchte eine eigene Diagnose (Konsens/Berechtigung), nicht Teil dieses Plans.

## Empfohlener Schnitt (PRs)

### PR 1 — In-Game-Menü (unabhängig von der Login-Entscheidung, kleinster eigenständiger Nutzen)

- `GameMenuComponent` erstellen (Presenter: Button + aufklappbares Menü/Dialog), eingebunden in
  `game.component.html` permanent sichtbar, auch während `currentGameStatus() === 'playing'`.
- "Spiel verlassen" ruft die bestehende `backToStartscreen()`-Logik auf (aus `GameComponent`
  extrahieren oder als `@Output()` durchreichen), ergänzt um den Auto-Save-Hinweistext.
- `logout()` aus `StartscreenComponent` in einen kleinen, wiederverwendbaren Service oder direkt
  dupliziert im Menü verfügbar machen (Signatur ist bereits trivial: `signOut(auth)` +
  Navigation).
- Verifikation: `ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI`, manueller Test
  „Menü öffnen während laufendem Spiel", „Verlassen führt zu Startscreen, erneuter Aufruf von
  `/game/{id}` lädt denselben Spielstand" (belegt den bestehenden Auto-Save für den Nutzer).

### PR 2 — Anonymous Auth als Standard-Einstieg (Option A)

- `app.config.ts`/ein neuer `AuthBootstrapService`: beim App-Start `signInAnonymously()`, falls
  kein Nutzer eingeloggt ist — Startscreen/Singleplayer sind damit ohne sichtbaren Login-Screen
  erreichbar.
- `src/models/user.class.ts`: `userEmail` optional machen, `AuthFormService.register()`
  (`auth-form.service.ts:50-61`) und `CurrentUserService` auf anonyme Nutzer ohne E-Mail prüfen.
- `signIn`/`signUp`-Routen bleiben bestehen, werden aber zu "Account sichern" statt "Login
  erzwingen" umbeschriftet — kein `redirectUnauthorizedTo` mehr nötig für `startscreen`/
  `game/:id`, da jeder Nutzer (anonym oder nicht) `request.auth != null` erfüllt.
- Verifikation: `ng build`, `ng test`, manueller Test „App im Privatfenster öffnen → direkt
  Singleplayer spielbar ohne Formular", „bestehender Login/Registrierung funktioniert weiter
  unverändert für Nutzer, die das wollen".

### PR 3 — Account-Verknüpfung (anonym → E-Mail/Passwort)

- `AuthFormService`: neue Methode `linkAnonymousAccount(email, password, nickname)` via
  `linkWithCredential`/`EmailAuthProvider.credential(...)` statt `createUserWithEmailAndPassword`
  für bereits (anonym) eingeloggte Nutzer — bestehender Spielstand (`users/{uid}`, laufende
  `games/{gameId}`) bleibt unter derselben `uid` erhalten.
- Fehlerfall (z. B. E-Mail bereits vergeben) darf den bestehenden anonymen Account nicht
  invalidieren — Nutzer bleibt weiter als Gast spielfähig, wenn die Verknüpfung fehlschlägt.
- UI-Einstieg: Hinweis im neuen `GameMenuComponent` und/oder Startscreen ("Account sichern, um
  von einem anderen Gerät weiterzuspielen").
- Verifikation: `ng build`, `ng test`, manueller Test „als Gast spielen → Account verknüpfen →
  gleicher Spielstand nach Logout/Login mit den neuen Zugangsdaten sichtbar", „Verknüpfung mit
  bereits vergebener E-Mail zeigt Fehler, Gast-Session bleibt nutzbar".

### PR 4 — Einladungslink für Multiplayer-Join (löst die "ID abtippen"-Reibung)

- `app.routes.ts`: `startscreen`-Route akzeptiert optionalen Query-Param (`?join=<gameId>`).
- `StartscreenComponent.ngOnInit()`: liest den Param, befüllt `joinGameId` und triggert
  optional direkt `joinGame()` nach Bestätigung.
- Neuer "Einladen"-Button (Startscreen beim Erstellen eines Multiplayer-Spiels + im
  `GameMenuComponent` aus PR 1) kopiert einen fertigen Link in die Zwischenablage.
- Security-Rücksprache vor Umsetzung: prüfen, ob die aktuelle `games/{gameId}`-Rule
  (`firestore.rules:36`, jeder eingeloggte Nutzer darf lesen/schreiben) für Links, die potenziell
  weiterverbreitet werden, weiterhin tragbar ist, oder ob Game-IDs dafür weniger vorhersehbar
  sein sollten (aktuell keine Aussage zur ID-Generierung getroffen — vor PR 4 klären).
- Verifikation: `ng build`, `ng test`, manueller Test „Link kopieren → in neuem Browser/Fenster
  öffnen → Spiel wird automatisch vorbefüllt/beigetreten".

## Verifikation (gesamter Plan)

- Jeder PR einzeln: `ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI`,
  `npm run test:rules` falls Firestore-Rules betroffen sind (PR 2, PR 4).
- Manueller End-to-End-Test vor Merge von PR 2/3: kompletter Pfad „App öffnen ohne Account →
  Singleplayer spielen → Account verknüpfen → auf zweitem Gerät/Browser einloggen → derselbe
  Spielstand erscheint" — bislang in keiner Session mit laufendem Firebase-Emulator/Browser-
  Setup durchführbar (wie bereits in `docs/done/dialog-auth-unification-plan.md` und
  `docs/planned/singleplayer-mode-plan.md` vermerkt) — vor dem jeweiligen Merge nachholen.

## Nicht im Scope

- Option B (echter Offline-Singleplayer ohne Firestore) — bewusst nicht gewählt, siehe
  Zielbild-Abschnitt; bleibt mögliche Folge-Iteration.
- "Spiel löschen/abbrechen"-Funktion im Menü — beträfe andere Mitspieler, eigene Diagnose nötig.
- Deutsch/Englisch-Vereinheitlichung der Texte (z. B. `signin.component.html:6`) über das für
  diesen Plan Nötige hinaus — laut Root-`CLAUDE.md` nicht ohne expliziten Auftrag anfassen; die
  in PR 2 ohnehin nötige Umbeschriftung von `signIn`/`signUp` ist die einzige Ausnahme, weil sie
  inhaltlich zur neuen Funktion gehört.
- Passwort-Reset-Flow, Social-Login (Google/Apple) — nicht Teil der genannten Probleme, eigene
  Anfrage nötig, falls gewünscht.

## Referenzen

- `docs/planned/singleplayer-mode-plan.md` — Spielregel-Umbau Singleplayer, Variante A/B-
  Entscheidung überschneidet sich mit dem Zielbild-Abschnitt hier.
- `docs/done/dialog-auth-unification-plan.md` — `AuthFormService`-Grundlage, auf der PR 2/3
  hier aufbauen.
- `src/app/services/CLAUDE.md` — bestehender Auto-Save-Mechanismus (Repository-Services), den
  PR 1 nur sichtbar macht, nicht neu baut.
- `firestore.rules` — Kommentar zu `games/{gameId}`-Zugriff, relevant für PR 4.
