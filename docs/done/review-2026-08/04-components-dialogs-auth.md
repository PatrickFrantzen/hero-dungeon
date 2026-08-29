# Code-Review: Dialog- und Auth-Komponenten (Signin/Signup/Startscreen)

## Status (2026-08-29, PR #21)

Umgesetzt: Login-Fehler werden jetzt sichtbar angezeigt, Submit-Button während des Requests
disabled (Befund 1); Registrierungs-Fehler werden abgefangen und angezeigt, `setDoc`-Write
wird jetzt awaited (Befund 2); Ok-Button im Settings-Dialog bei ungültigem Formular disabled
(Befund 9); `afterClosed()`-Ergebnis wird vor Zugriff auf `.data` geprüft, `joinGame()`
validiert die Eingabe und zeigt „Spiel nicht gefunden" statt einer unhandled rejection
(Befund 6); `DialogGameSettings` → `DialogGameSettingsComponent` umbenannt (Teil von Befund 7).

Offen, siehe [`docs/planned/dialog-auth-unification-plan.md`](../../planned/dialog-auth-unification-plan.md):
`AuthFormService`-Extraktion aus Signin/Signup (Befund 3), `BaseDialogComponent`/typisierte
`MAT_DIALOG_DATA` für die drei Dialoge (Befund 4), `StartscreenComponent` entflechten in
`GameFactoryService`/Firestore-Service/Angular-Forms statt `getElementById` (Befund 5).
Nicht umgesetzt, nice-to-have und noch nicht neu geplant: Reactive-Forms- vs. Template-Ref-
Mischung im Settings-Dialog (Befund 8), restliche Deutsch/Englisch-Naming-Inkonsistenzen
(Befund 7, laut `CLAUDE.md` nur bei expliziter Beauftragung).

## Überblick

Scope dieses Abschnitts: `dialog-choose-hero`, `dialog-game-settings`, `dialog-heropower`,
`signin`, `signup`, `startscreen` sowie `app.routes.ts`/`app.config.ts` (Routing-/Guard-
Konfiguration). Der Code ist inzwischen auf Standalone-Components mit `imports: [...]` und
`ChangeDetectionStrategy.OnPush` migriert (siehe `docs/done/onpush-refactor-plan.md`) — die
Modul-Beschreibung in der Root-`CLAUDE.md` ist für diesen Teil des Baumes veraltet. Auth läuft
über `@angular/fire/auth` (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`,
`signOut`), Guards über `@angular/fire/auth-guard` (`redirectLoggedInTo`/
`redirectUnauthorizedTo`) in `app.routes.ts`.

Kernbefund vorweg: **Auth-Fehler werden im gesamten Scope nirgends dem Nutzer angezeigt** —
weder bei Login noch bei Registrierung. Daneben gibt es erhebliche Duplikation zwischen den drei
Dialog-Komponenten (identisches MatDialogRef-Boilerplate) und zwischen Signin/Signup
(Formular-Aufbau, Navigation), sowie eine deutlich überladene `StartscreenComponent`.

## Befunde

### 1. Firebase-Auth-Fehler werden verschluckt (Login)

**Betroffene Dateien:** `src/app/components/signin/signin.component.ts:39-51`

**Problem:** Im `.catch()` von `signInWithEmailAndPassword` werden `error.code` und
`error.message` in lokale Variablen geschrieben und dann nicht weiterverwendet — kein
`console.error`, kein UI-Feedback, kein Rethrow:

```ts
.catch((error) => {
  const errorCode = error.code;
  const errorMessage = error.message;
})
```

Bei falschem Passwort, nicht existierendem Account oder Netzwerkfehler bleibt der Nutzer auf der
Login-Seite ohne jede Rückmeldung — es sieht aus, als würde nichts passieren. Das Formular hat
zudem kein `[disabled]`-State während des Requests, d.h. Mehrfachklicks auf "Login" lösen
mehrere parallele `signInWithEmailAndPassword`-Aufrufe aus.

**Vorschlag (kritisch):** Fehlerfall auswerten und dem Nutzer sichtbar machen, z.B. per
`MatSnackBar` oder einem Fehlertext im Template (die auskommentierten `mat-error`-Zeilen in
`signin.component.html:13,20` deuten darauf hin, dass das ursprünglich vorgesehen war, aber nie
fertiggestellt wurde). Zusätzlich einen `isSubmitting`-Flag/Signal einführen, das den
Submit-Button während des Requests deaktiviert.

### 2. Firebase-Auth-Fehler werden komplett ignoriert (Registrierung)

**Betroffene Dateien:** `src/app/components/signup/signup.component.ts:42-54`

**Problem:** `register()` hat für `createUserWithEmailAndPassword(...)` **gar keinen**
`.catch()`-Handler — die Promise-Chain (`.then().then()`) bricht bei einem Fehler (z.B.
`auth/email-already-in-use`, `auth/weak-password`) still ab. Der zweite `.then()` (Navigation zu
`startscreen`) wird dann zwar nicht ausgeführt, aber es gibt keinerlei Hinweis an den Nutzer,
warum die Registrierung nicht funktioniert hat — und die Rejection landet als unhandled promise
rejection in der Konsole.

Verschärfend: `getEmailErrorMessage()`, `getPasswordErrorMessage()`, `getNicknameErrorMessage()`
(Zeilen 57-77) existieren bereits als Fehlertext-Helfer und werden im Template auch verwendet
(`signup.component.html:14,23,31`) — es fehlt nur das Äquivalent für den asynchronen
Firebase-Fehler nach dem Submit.

**Vorschlag (kritisch):** `.catch()` an die Promise-Chain anhängen, Fehlertext (analog zu den
bestehenden `getXErrorMessage()`-Methoden) im Template anzeigen. Gleiches
`isSubmitting`-Disabled-Pattern wie bei Signin.

### 3. Duplikat: Formular-Aufbau, Auth-Aufruf, Navigation zwischen Signin/Signup

**Betroffene Dateien:** `signin.component.ts:24-55`, `signup.component.ts:27-81`

**Problem:** Beide Komponenten haben nahezu identischen Aufbau:
- `FormBuilder`-Injection + `FormGroup` in `ngOnInit` aufbauen (`signin.component.ts:32-35` /
  `signup.component.ts:34-38`)
- Firebase-`Auth`-Aufruf mit `.then()`/`.catch()`, danach `this.route.navigate([...])`
- Eine `redirectToX()`/`backToSignIn()`-Methode, die nur zur jeweils anderen Route navigiert
  (`signin.component.ts:53-55`, `signup.component.ts:79-81`)
- Beide injizieren `Auth` und `Router` identisch

Das Einzige, was strukturell abweicht, ist die Anzahl/Art der Formfelder und der konkrete
Firebase-Call. Nach DRY/SRP ließe sich das gemeinsame Muster extrahieren.

**Vorschlag (wichtig):** Einen `AuthFormService` (oder `AuthFacadeService`) einführen, der
`login(email, password): Promise<void>` und `register(email, password, nickname): Promise<void>`
kapselt — inkl. Fehlerbehandlung (Mapping von Firebase-Error-Codes auf verständliche deutsche
Meldungen an einer Stelle statt potenziell zweimal). Die Komponenten bleiben dünn: Formular
validieren, Service-Methode aufrufen, `loading`/`errorMessage`-Signal setzen, bei Erfolg
navigieren. Der User-Dokument-Write in `signup.component.ts:48-49` (`setDoc(doc(db, 'users',
uid), ...)`) gehört ebenfalls in diesen Service statt direkt in der Komponente (siehe Befund 5).
Die Rück-Navigation (`redirectToSignUp`/`backToSignIn`) könnte zu einer einzigen
`navigate(path: string)`-Hilfsmethode oder gleich zu `routerLink` im Template werden — aktuell
wird dafür unnötig eine Klassenmethode pro Richtung gepflegt.

### 4. Duplikat: MatDialogRef-Boilerplate in allen drei Dialog-Komponenten

**Betroffene Dateien:**
`dialog-choose-hero.component.ts:62-68`,
`dialog-game-settings.component.ts:35-43`,
`dialog-heropower.component.ts:20-30`

**Problem:** Alle drei Dialoge folgen exakt demselben Muster:

```ts
constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<X>) {}

getChoosenHero(...) {
  this.dialogRef.close({ data: { ... } })
}
```

- `MAT_DIALOG_DATA` wird in allen drei Fällen als `any` bzw. lose typisiertes Objekt injiziert
  (`dialog-choose-hero.component.ts:62`, `dialog-game-settings.component.ts:35` — `data` wird
  dort injiziert, aber im Ganzen nie gelesen, ein totes Konstruktor-Argument).
- Das Schließen erfolgt überall über dasselbe `{ data: {...} }`-Wrapper-Objekt, das keine
  gemeinsame Typdefinition hat.
- `dialog-game-settings.component.html:35` liest die Werte direkt aus Template-Referenzen
  (`playerNumber.valueAsNumber`, `gameId.value`) statt aus dem `FormControl`/`FormGroup` selbst
  (`playerValidation`, `idValidation` werden befüllt, aber ihr `.value` nirgends gelesen —
  totes Code-Konstrukt, siehe Befund 8).

**Vorschlag (nice-to-have, aber gut isolierbar):** Eine schlanke Basis-Klasse/Utility
`BaseDialogComponent<TResult>` mit einer `close(result: TResult)`-Methode, die intern das
`{ data: result }`-Wrapping übernimmt, plus generisches `MAT_DIALOG_DATA`-Interface pro Dialog
(`ChooseHeroDialogData`, `GameSettingsDialogData`, `HeropowerDialogData` statt `any`). Reduziert
nicht viele Zeilen, verbessert aber Typsicherheit und macht das Ergebnis-Contract zwischen Dialog
und aufrufender Komponente (`startscreen.component.ts:69-79`) explizit statt implizit über
`result.data.xyz`-Zugriffe auf ein ungetyptes Objekt.

### 5. SRP-Verstoß: `StartscreenComponent` mischt Navigation, Dialog-Orchestrierung, Spiel-Domänenlogik und Firestore-Zugriff

**Betroffene Datei:** `src/app/components/startscreen/startscreen.component.ts` (134 Zeilen)

**Problem:** Die Komponente übernimmt mindestens fünf verschiedene Verantwortlichkeiten:

1. Auth/Navigation (`logout()`, Zeile 113-118)
2. Dialog öffnen + Ergebnis interpretieren (`openDialog()`, Zeile 61-80)
3. **Spiel-Domänenlogik**: `setGameSettings()` (Zeile 82-110) baut ein komplettes `Game`-Objekt
   inkl. Mob-Erzeugung (`new Monster().createMob(...)`), Boss-Auswahl, Default-Werten
   (`isLost: false`, hartcodierter `"Baby-Barbar"`-Boss-Block Zeile 96-97) — das ist
   Spiellogik, keine UI-Logik.
4. **Direkter Firestore-Zugriff**: `db = getFirestore()` (Zeile 30) und `setDoc(docRef, ...)`
   (Zeile 74) direkt in der Komponente, ohne Service-Layer und ohne Error-Handling (kein
   `.catch()` an der `setDoc(...).then(...)`-Chain, Zeile 74-77 — analog zu Befund 1/2 kann ein
   Schreibfehler beim Spiel-Erstellen stillschweigend verschwinden).
5. **Direkter DOM-Zugriff** statt Angular-Forms: `joinGame()` liest den Eingabewert per
   `document.getElementById('joinGame')` (Zeile 121) statt über `ngModel`/`FormControl` — bricht
   mit dem Rest der Codebasis, das an anderer Stelle (Dialoge, Signin/Signup) durchgehend
   Angular-Forms nutzt, und ist im Ist-Zustand nicht typsicher (`as HTMLInputElement`-Cast ohne
   Null-Check, falls das Element aus dem DOM entfernt würde).

**Vorschlag (wichtig):**
- Spiellogik aus `setGameSettings()` in einen `GameFactoryService` (o.ä.) auslagern —
  `buildNewGame(numberOfPlayer, difficulty, gameId): Game` — reine Funktion ohne
  Komponentenzustand, gut isoliert testbar (aktuell nicht getestet, `startscreen.component.spec.ts`
  ist nur das generierte Grundgerüst).
- Firestore-Schreibzugriff (`setDoc` für neue Spiele) in einen bestehenden oder neuen
  `GameService` verschieben, analog zu `LoadGameService` (bereits injiziert, Zeile 47) — dort
  auch Fehlerbehandlung zentralisieren.
- `joinGame()` auf ein `FormControl`/`ngModel` statt `getElementById` umstellen; damit entfällt
  auch der ungesicherte DOM-Cast.
- Nach der Extraktion bleibt in der Komponente nur noch Orchestrierung: Dialog öffnen, Service
  aufrufen, navigieren — deutlich näher an Single Responsibility.

### 6. Fehlende Validierung/Fehlerbehandlung beim Spiel erstellen und beitreten

**Betroffene Datei:** `startscreen.component.ts:69-80` (Spiel erstellen), `120-132` (`joinGame`)

**Problem:**
- `openDialog()` greift ungeprüft auf `result.data.gameId` zu (Zeile 71); schließt der Nutzer den
  Dialog per ESC/Backdrop statt über den Ok-Button, ist `result` `undefined` und
  `result.data` wirft eine `TypeError` (kein `if (result)`-Guard, anders als in
  `setGameSettings()`, wo zumindest `if (data)` geprüft wird, Zeile 83).
- `joinGame()` (Zeile 120-132) validiert `inputValue` nicht — ein leerer String navigiert trotzdem
  zu `/game/` (ohne ID) und dispatcht/lädt mit leerer Game-ID; `loadGame.loadGameCollectionData(inputValue)`
  hat kein `.catch()`, ein nicht existierendes Spiel führt zu einer unhandled rejection statt
  einer Nutzer-Rückmeldung ("Spiel nicht gefunden").

**Vorschlag (wichtig):** `dialogRef.afterClosed()` grundsätzlich auf `undefined`/Abbruch prüfen,
bevor auf `.data` zugegriffen wird (Pattern für alle drei Dialog-Aufrufer, siehe auch Befund 4).
Für `joinGame()`: leere Eingabe clientseitig abfangen (Button `disabled`, wenn Input leer) und
`.catch()` an `loadGameCollectionData` mit Nutzer-Feedback bei nicht existierender Spiel-ID.

### 7. Naming-Inkonsistenz Deutsch/Englisch

**Betroffene Dateien:** durchgängig im Scope

**Beispiele:**
- `dialog-choose-hero.component.ts:64` `getChoosenHero(choosenHero: any)` — "choosenHero" ist
  zudem falsch geschrieben (**chosen**, nicht *choosen*); derselbe Tippfehler wiederholt sich in
  `dialog-heropower.component.ts:22,25` (`getChoosenHero`, `selectedValue.playerHero` ist ok,
  aber `getChoosenHero` als Methodenname trägt den Fehler weiter) und in
  `startscreen.component.ts:29,90` (`choosenHeros`).
- UI-Text ist gemischt: Signin/Signup sind komplett auf Englisch ("Please log into your
  Account", "Sign Up"), während Startscreen, die Dialoge und deren Templates auf Deutsch sind
  ("Wähle einen Helden", "Spieleinstellungen", "Willkommen").
- `dialog-game-settings.component.ts:23` Klassenname `DialogGameSettings` bricht mit der
  Namenskonvention der übrigen beiden Dialoge (`DialogChooseHeroComponent`,
  `DialogHeropowerComponent`) — fehlendes `Component`-Suffix.

**Vorschlag (nice-to-have):** Laut `CLAUDE.md` nicht im Rahmen dieses Reviews vereinheitlichen,
sofern nicht explizit beauftragt — hier nur dokumentiert, damit es bei einer künftigen
Sprachbereinigung (eigenes Issue) nicht verloren geht. Einzige Ausnahme, die separat vom
Sprach-Thema zu sehen ist: `DialogGameSettings` → `DialogGameSettingsComponent` umbenennen, das
ist reine Konventions-Konsistenz, keine Sprachfrage.

### 8. Toter Code: ungenutzte `FormControl`s in `DialogGameSettings`

**Betroffene Datei:** `dialog-game-settings.component.ts:24-25`, `dialog-game-settings.component.html:7,26,35`

**Problem:** `playerValidation` und `idValidation` sind als `FormControl` deklariert und per
`[formControl]` ans Template gebunden (nur für die `mat-error`-Anzeige bei `.invalid`), aber
`getGameSettings(...)` liest die tatsächlichen Werte nicht aus den Controls, sondern aus den
Template-Referenzvariablen `#playerNumber`/`#gameId` (`dialog-game-settings.component.html:35`:
`playerNumber.valueAsNumber, selectedValue, gameId.value`). Die `FormControl`s dienen also
ausschließlich der Fehleranzeige, nicht als Datenquelle — funktioniert nur, weil beide Werte
zufällig synchron gehalten werden (`[formControl]` UND `#template-ref` auf demselben `<input>`).
Das ist fehleranfällig bei künftigen Änderungen und vermischt zwei Muster
(Reactive-Forms-Value vs. Template-Ref-Value) ohne Grund.

**Vorschlag (nice-to-have):** Auf ein durchgängiges Muster festlegen — entweder komplett über
`FormGroup`/`formControlName` (Wert aus `this.form.value`) oder komplett über Template-Refs ohne
`FormControl`-Fassade. Reactive Forms ist konsistenter mit Signin/Signup und würde zusätzlich
eine echte `Validators.min(2)`/`Validators.max(5)`-Prüfung *vor* dem Schließen des Dialogs
ermöglichen (aktuell kann der Ok-Button trotz `mat-error` geklickt werden — es gibt kein
`[disabled]="playerValidation.invalid"` am Button, `dialog-game-settings.component.html:35`).

### 9. Fehlende `disabled`-Bindung trotz sichtbarer Validierungsfehler

**Betroffene Datei:** `dialog-game-settings.component.html:35`

**Problem:** Der Ok-Button ist nie disabled, selbst wenn `playerValidation.invalid` oder
`idValidation.invalid` `true` ist und die zugehörigen `mat-error`-Texte angezeigt werden
(Zeile 8-10, 27-29). Der Nutzer kann den Dialog mit ungültigen/leeren Werten schließen; die
aufrufende Komponente (`startscreen.component.ts:82`) verlässt sich dann auf `if (data)`, prüft
aber nicht, ob `numberOfPlayer` tatsächlich zwischen 2 und 5 liegt oder `gameId` nicht leer ist.

**Vorschlag (wichtig):** `[disabled]="playerValidation.invalid || idValidation.invalid"` am
Ok-Button ergänzen (analog müsste bei einer Umstellung auf Befund 8 dann `formGroup.invalid`
verwendet werden).

## Priorisierte Empfehlungen

**Kritisch (Nutzer bekommt Fehler nicht mit, produktionsrelevant):**
1. Befund 1 — Login-Fehler dem Nutzer anzeigen (`signin.component.ts:47-50`).
2. Befund 2 — Registrierungs-Fehler abfangen und anzeigen (`signup.component.ts:42-54`, fehlender `.catch()`).

**Wichtig (Struktur/Robustheit):**
3. Befund 5 — `StartscreenComponent` entflechten: Spiellogik → `GameFactoryService`, Firestore-Writes → Service, `getElementById` → Angular-Forms.
4. Befund 6 — `afterClosed()`-Ergebnis und `joinGame()`-Eingabe validieren, bevor darauf zugegriffen wird.
5. Befund 3 — gemeinsamen `AuthFormService` für Signin/Signup extrahieren (inkl. zentralem Error-Mapping, das direkt Befund 1+2 mitlöst).
6. Befund 9 — Ok-Button im Settings-Dialog bei ungültigem Formular disablen.

**Nice-to-have (Konsistenz/Wartbarkeit):**
7. Befund 4 — `BaseDialogComponent`/typisierte `MAT_DIALOG_DATA`-Interfaces für die drei Dialoge.
8. Befund 8 — Reactive-Forms- vs. Template-Ref-Mischung im Settings-Dialog auflösen.
9. Befund 7 — Naming-Inkonsistenzen dokumentiert für ein künftiges, explizit beauftragtes Sprachbereinigungs-Issue; `DialogGameSettings` → `DialogGameSettingsComponent` als eigenständige, sprachunabhängige Korrektur.
