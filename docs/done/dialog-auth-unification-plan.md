# Refactoring-Plan: Dialog- und Auth-Komponenten vereinheitlichen

Kontext: Punkt 7 der „Empfohlenen Reihenfolge" aus
`docs/done/review-2026-08/00-overview.md`, Detailbefunde 3/4/5 in
`docs/done/review-2026-08/04-components-dialogs-auth.md`. Die kritischen Befunde aus dieser
Datei (verschluckte Auth-Fehler, fehlende Validierung) sind bereits in PR #21 behoben — dieser
Plan behandelt die verbleibende strukturelle Vereinheitlichung. Stand der Diagnose:
2026-08-29, nach PR #21.

## Diagnose

**Signin/Signup dupliziert Formular-Aufbau, Auth-Aufruf, Navigation:**
- `SigninComponent` (`src/app/components/signin/signin.component.ts`) und `SignupComponent`
  (`src/app/components/signup/signup.component.ts`) injizieren beide `Auth`+`FormBuilder`+
  `Router` identisch, bauen ihre `FormGroup` in `ngOnInit()` auf
  (`signin.component.ts:31-37`, `signup.component.ts:35-41`), rufen einen Firebase-Auth-Call
  mit `.then()`/`.catch()`/`.finally()` bzw. `try/catch` auf und navigieren bei Erfolg.
  Nach PR #21 haben beide zusätzlich identisches `errorMessage`/`isSubmitting`-Boilerplate
  (`signin.component.ts:21-22`, `signup.component.ts:22-23`) und dieselbe
  Submitting-Guard-Logik.
- `redirectToSignUp()`/`backToSignIn()` (`signin.component.ts:57-59`,
  `signup.component.ts:85-87`) sind reine Ein-Zeiler-Navigationsmethoden zur jeweils anderen
  Route.
- `SignupComponent` baut zusätzlich eine eigene `db = getFirestore()`-Instanz
  (`signup.component.ts:25`) für den `setDoc`-Write des Nutzerprofils (`:52-53`) — dieselbe
  Art direkter Firestore-Zugriff, die
  `docs/done/firestore-repository-service-plan.md` für die übrigen Komponenten/Services
  konsolidiert; gehört fachlich dorthin, wird hier nur als Konsument mit erwähnt.

**Dupliziertes `MatDialogRef`-Boilerplate in allen drei Dialog-Komponenten:**
- `DialogChooseHeroComponent` (`dialog-choose-hero.component.ts:62`),
  `DialogGameSettingsComponent` (`dialog-game-settings.component.ts:35`),
  `DialogHeropowerComponent` (`dialog-heropower.component.ts:20`) folgen alle demselben Muster:
  `constructor(@Inject(MAT_DIALOG_DATA) public data: <lose typisiert>, private dialogRef:
  MatDialogRef<X>) {}` gefolgt von einer Methode, die `this.dialogRef.close({data: {...}})`
  aufruft.
  - `DialogChooseHeroComponent.data` (`:62`) und `DialogGameSettingsComponent.data` (`:35`)
    werden injiziert, aber **nie gelesen** — totes Konstruktor-Argument in beiden Fällen (nur
    `DialogHeropowerComponent.data` wird tatsächlich als `[data]`-Input im aufrufenden
    `openDialog()` befüllt und im Template konsumiert).
  - Das Schließen-Ergebnis (`{data: {...}}`) hat keine gemeinsame Typdefinition — jeder
    Aufrufer (`startscreen.component.ts:69-71` für `DialogGameSettingsComponent`,
    `player-hand.component.ts:574-580` für `DialogHeropowerComponent`) greift auf
    `result.data.xyz` mit implizitem `any` zu.

**`StartscreenComponent` mischt fünf Verantwortlichkeiten**
(`src/app/components/startscreen/startscreen.component.ts`, 137 Zeilen nach PR #21):
1. Auth/Navigation (`logout()`, `:113-117`).
2. Dialog öffnen + Ergebnis interpretieren (`openDialog()`, `:61-80` — Guard gegen
   `undefined`-Ergebnis seit PR #21 vorhanden).
3. **Spiel-Domänenlogik**: `setGameSettings()` (`:82-110`) baut ein komplettes `Game`-Objekt
   inkl. Mob-Erzeugung (`new Monster().createMob(...)`), Boss-Auswahl, hartcodiertem
   `"Baby-Barbar"`-Default (`:95-98`).
4. **Direkter Firestore-Zugriff**: `db = getFirestore()` (`:30`), `setDoc(docRef, ...)`
   (`:73-74`) direkt in der Komponente statt über einen Service.
5. **Direkter DOM-Zugriff** statt Angular-Forms: `joinGame()` liest per
   `document.getElementById('joinGame')` (`:121`) statt über `ngModel`/`FormControl`.

## TODOs

- [ ] **TODO 1 — `AuthFormService` extrahieren**
  - Neue Datei `src/app/services/auth-form.service.ts`: `login(email, password):
    Promise<void>` und `register(email, password, nickname): Promise<void>`, kapselt den
    Firebase-Auth-Call inkl. Fehler-Mapping (Firebase-Error-Codes wie `auth/wrong-password`,
    `auth/email-already-in-use` auf verständliche deutsche Meldungen abbilden — an **einer**
    Stelle statt potenziell zweimal, falls Signin/Signup künftig auseinanderdriften).
  - Der User-Dokument-Write aus `SignupComponent.register()` (`:48-53`) wandert ebenfalls in
    diesen Service (oder in den `PlayerRepositoryService`/`GameRepositoryService` aus
    `docs/done/firestore-repository-service-plan.md`, falls der zu diesem Zeitpunkt schon
    existiert — dann dort statt in `AuthFormService`, um Firestore-Zugriff an einer Stelle zu
    bündeln).
  - `SigninComponent`/`SignupComponent` rufen nur noch die Service-Methode auf, setzen
    `errorMessage`/`isSubmitting` (Felder bleiben in der Komponente, da sie reinen UI-Zustand
    beschreiben) und navigieren bei Erfolg.
  - `redirectToSignUp()`/`backToSignIn()` optional durch `routerLink` im Template ersetzen
    statt einer Klassenmethode pro Richtung (kleine, unabhängige Vereinfachung).
  - Verifikation: `ng build`, `ng test`, manueller Test „Login mit falschem Passwort zeigt
    Fehlermeldung", „Registrierung mit bereits vergebener E-Mail zeigt Fehlermeldung",
    „erfolgreicher Login/Registrierung navigiert wie bisher".

- [ ] **TODO 2 — `BaseDialogComponent`/typisierte `MAT_DIALOG_DATA` für die drei Dialoge**
  - Schlanke Basis-Klasse oder Utility mit `close(result: TResult)`, die intern das
    `{data: result}`-Wrapping übernimmt — reduziert nicht viele Zeilen, verbessert aber
    Typsicherheit und macht den Ergebnis-Contract zwischen Dialog und Aufrufer explizit.
  - Ein dediziertes Interface pro Dialog statt `any`: `ChooseHeroDialogData`,
    `GameSettingsDialogData`, `HeropowerDialogData` (Name/Form an den tatsächlich übergebenen
    `data`-Werten orientieren, siehe Diagnose — bei `DialogChooseHeroComponent`/
    `DialogGameSettingsComponent` ist das injizierte `data` aktuell ungenutzt, ggf. beim
    Typisieren gleich als „wird nicht gebraucht" markieren/entfernen statt künstlich zu
    typisieren).
  - Aufrufer (`startscreen.component.ts:69-71`, `player-hand.component.ts:574-580`) auf die
    neuen Typen statt implizitem `any` umstellen.
  - Verifikation: `ng build` (TypeScript deckt hier die meisten vergessenen Anpassungen als
    Typfehler ab), `ng test`.

- [ ] **TODO 3 — `StartscreenComponent` entflechten**
  - Spiellogik aus `setGameSettings()` (`:82-110`) in einen `GameFactoryService`
    (`buildNewGame(numberOfPlayer, difficulty, gameId): Game`, reine Funktion ohne
    Komponentenzustand) auslagern.
  - Firestore-Schreibzugriff (`setDoc` für neue Spiele, `:73-74`) in den `GameRepositoryService`
    aus `docs/done/firestore-repository-service-plan.md` verschieben, falls der zu diesem
    Zeitpunkt existiert — sonst vorerst in einen neuen, eigenständigen Service, der später dort
    aufgeht.
  - `joinGame()`s `document.getElementById('joinGame')`-Zugriff (`:121`) durch ein
    `FormControl`/`ngModel` ersetzen; die in PR #21 ergänzte Validierung (leere Eingabe
    abfangen, `joinGameError` bei nicht gefundenem Spiel) bleibt inhaltlich erhalten, wird aber
    auf das neue Formular-Feld umgestellt statt auf den direkten DOM-Wert.
  - Nach der Extraktion bleibt in der Komponente nur noch Orchestrierung: Dialog öffnen,
    Service aufrufen, navigieren.
  - Verifikation: `ng build`, `ng test`, manueller Test „neues Spiel erstellen (gültige und
    ungültige Eingaben im Settings-Dialog)", „bestehendem Spiel per ID beitreten (existierende
    und nicht-existierende ID)".

## Verifikation (gesamter Plan)

- `ng build` und `ng test --watch=false --browsers=ChromeHeadlessCI` nach jedem TODO grün.
- Manueller Test vor dem finalen Merge: kompletter Startscreen-Flow (Login → Spiel erstellen →
  zweiter Spieler tritt bei → Helden-Auswahl-Dialog → Spiel startet), da TODO 1-3 gemeinsam
  fast den gesamten Onboarding-Pfad der App berühren.

## Nicht im Scope

- Deutsch/Englisch-Naming-Inkonsistenzen (Befund 7 in
  `docs/done/review-2026-08/04-components-dialogs-auth.md`) — laut `CLAUDE.md` nur bei
  expliziter Beauftragung vereinheitlichen, hier bewusst ausgeklammert.
- Reactive-Forms- vs. Template-Ref-Mischung im Settings-Dialog (Befund 8) — unabhängig von
  diesem Plan, kein Blocker für TODO 1-3.
- `FirestoreRepositoryService`-Einführung selbst (paralleler Plan,
  `docs/done/firestore-repository-service-plan.md`) — TODO 1 und TODO 3 hier verweisen darauf,
  führen ihn aber nicht selbst ein; falls dieser Plan zuerst umgesetzt wird, vorerst einen
  eigenständigen kleinen Service für den jeweiligen Firestore-Zugriff schreiben und später auf
  das Repository-Pattern migrieren.

## Referenzen

- `docs/done/review-2026-08/04-components-dialogs-auth.md` — vollständige Befundliste
  (Befund 1/2/6/9 bereits in PR #21 erledigt; Befund 3/4/5 sind hier relevant).
- `docs/done/firestore-repository-service-plan.md` — Zielbild für den Firestore-Zugriff, den
  TODO 1 und TODO 3 hier voraussetzen.
- `src/app/components/dialog-heropower/dialog-heropower.component.ts` — bereits das am
  saubersten typisierte der drei Dialog-`data`-Interfaces (`{ playerName, playerId, playerHero
  }[]`), guter Ausgangspunkt für TODO 2.
