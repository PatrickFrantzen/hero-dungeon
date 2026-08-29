# Code-Review: Models (Helden, Monster, Game, User)

## Status (2026-08-29, PR #21)

Befund 6 (Zuweisung statt Vergleich in `createMob`) war beim Prüfen bereits vor diesem Review
behoben (Commit `ed16685`, #20): `monster.class.ts` vergleicht `currentBossName` korrekt mit
`==`, kein `bossname`-Feld mehr vorhanden — kein Fix nötig. Umgesetzt in PR #21: Befund 1
(gemeinsamer Konstruktor-Aufbau) via `Hero.buildCardstack()` gelöst — reduziert die 10
Heldenklassen von ~10 auf ~1 Zeile Konstruktor-Rumpf; Befund 4 (`shuffle`-Duplikat) durch
`src/models/shuffle.util.ts` konsolidiert; Befund 5 teilweise (Datenliterale
`questCollection`/`bossCollection`/`monsterCollection` nach `monster-collection.data.ts`
ausgelagert, `monster.class.ts` von 474 auf ~130 Zeilen reduziert — die `createMob`-Kaskade
selbst ist noch nicht tabellarisiert).

Offen, siehe [`docs/planned/hero-data-model-plan.md`](../../planned/hero-data-model-plan.md): Befund 2 (Karten-Deck-
Duplikate) und Befund 3 (datengetriebener Helden-Ansatz statt 10 Klassen) — Befund 1 aus diesem
Plan war die risikoarme Vorstufe dazu und ist bereits erledigt. Nicht umgesetzt, nice-to-have
und noch nicht neu geplant: `createMob`-Kaskade tabellarisieren und 9-Positionsparameter von
`getMonsterForGame` durch ein Objekt ersetzen (Rest von Befund 5), Typisierung schärfen
(`any`, Union-Types, Kartennamen-Enum — Befund 7), totes `Herointerface` (Teil von Befund 7).

## Überblick

Scope: `src/models/helden/*.class.ts` (10 Heldenklassen + Basisklasse `hero.class.ts` +
`card.class.ts`), `src/models/monster/monster.class.ts`, `src/models/game.ts`,
`src/models/user.class.ts`.

Kernbefund vorweg: Die 10 Heldenklassen sind bis auf vier Werte (`heroName`, `heroPower`,
`description`, Karten-Map) strukturell identisch — der Konstruktor-Rumpf (Map aufbauen,
`forEach`+innere `for`-Schleife, `shuffle`) ist zehnmal Zeichen-für-Zeichen dasselbe Muster.
Noch auffälliger: die *Karten-Maps selbst* sind paarweise identisch (5 Duplikate über 10
Klassen), was stark dafür spricht, dass es inhaltlich nur 5 verschiedene "Kartendeck-Typen"
gibt, die zufällig 10 Heldennamen zugeordnet wurden. `monster.class.ts` ist mit 474 Zeilen die
mit Abstand größte Modell-Datei, besteht aber zu ~85 % aus reinen Datenliteralen
(`monsterCollection`, `bossCollection`, `questCollection`); die verbleibende Logik enthält
einen echten Bug (Zuweisung statt Vergleich, siehe Befund 6) und eine Parameterliste mit 9
Positionsargumenten.

## Befunde

### 1. Identischer Konstruktor-Aufbau in allen 10 Heldenklassen (DRY, kritisch)

**Betroffene Dateien:**
- `src/models/helden/barbar.class.ts:9-32`
- `src/models/helden/dieb.class.ts:10-31`
- `src/models/helden/gladiator.class.ts:10-33`
- `src/models/helden/jägerin.class.ts:10-30`
- `src/models/helden/magier.class.ts:10-30`
- `src/models/helden/ninja.class.ts:10-31`
- `src/models/helden/paladin.class.ts:9-31`
- `src/models/helden/waldläufer.class.ts:10-30`
- `src/models/helden/walküre.class.ts:9-31`
- `src/models/helden/zauberin.class.ts:10-30`

**Problem:** Jede Klasse wiederholt exakt dasselbe Muster:

```ts
// z.B. barbar.class.ts:9-32, wortgleich (bis auf die Map) in allen anderen 9 Klassen
constructor() {
    super();
    const heroCards = new Map([ /* ... */ ])
    heroCards.forEach((value, key) => {
        for (let i = 0; i < value; i++) {
            this.cardstack.push(key);
        }
    })
    shuffle(this.cardstack)
}
```

10 Klassen × ~10 identische Zeilen = ~100 Zeilen reine Kopie desselben Algorithmus
("Map von Kartenname→Anzahl in einen flachen, gemischten Stapel expandieren"). Jede
Änderung an diesem Algorithmus (z.B. andere Shuffle-Strategie, Validierung negativer
Werte, Logging) muss zehnfach nachgezogen werden — klassischer DRY-Verstoß, hohes
Fehlerrisiko bei Copy-Paste-Wartung (z.B. vergisst man in einer der zehn Dateien den
`shuffle()`-Aufruf, fällt es nicht auf, weil kein Test das prüft, siehe Befund 4).

**Vorschlag (wichtig → sollte zusammen mit Befund 2 angegangen werden):** Gemeinsame
Logik in die Basisklasse `Hero` (`src/models/helden/hero.class.ts`) als geschützte
Methode extrahieren:

```ts
// hero.class.ts
export class Hero {
    // ... bestehende Felder ...

    protected buildCardstack(cardCounts: Map<string, number>): string[] {
        const stack: string[] = [];
        cardCounts.forEach((count, cardName) => {
            for (let i = 0; i < count; i++) {
                stack.push(cardName);
            }
        });
        return shuffle(stack);
    }
}
```

Jede Unterklasse reduziert sich dann auf:

```ts
// barbar.class.ts
constructor() {
    super();
    this.cardstack = this.buildCardstack(new Map([
        ['red', 5], ['yellow', 7], /* ... */
    ]));
}
```

Das beseitigt die Duplikation, ohne die Klassenhierarchie sofort anzutasten — ein
kleinerer, risikoärmerer erster Schritt als Befund 2.

### 2. Karten-Decks sind paarweise identische Daten, nicht nur strukturell ähnlich (DRY, kritisch)

**Betroffene Dateien:**
- `src/models/helden/barbar.class.ts:11-24` und `src/models/helden/gladiator.class.ts:12-25`
  — identische `Map`-Inhalte (nur `heroPower`/`description` unterscheiden sich).
- `src/models/helden/dieb.class.ts:12-23` und `src/models/helden/ninja.class.ts:12-23`
  — identisch.
- `src/models/helden/jägerin.class.ts:12-22` und `src/models/helden/waldläufer.class.ts:12-22`
  — identisch.
- `src/models/helden/paladin.class.ts:11-23` und `src/models/helden/walküre.class.ts:11-23`
  — identisch.
- `src/models/helden/magier.class.ts:12-22` und `src/models/helden/zauberin.class.ts:12-22`
  — identisch.

**Problem:** Alle 10 Heldenklassen bilden genau 5 Paare mit *wortgleicher* Karten-Map
(gleiche Keys, gleiche Werte, gleiche Reihenfolge). Nur `heroName`, `heroPower` und
`description` unterscheiden die beiden Klassen eines Paares. Das ist keine zufällige
Ähnlichkeit, sondern dieselbe Datenmenge, die als Code zweimal eingetippt wurde — jede
inhaltliche Balance-Änderung (z.B. Barbar bekommt eine Karte mehr) muss man sich bewusst
merken, auch in `gladiator.class.ts` nachzuziehen, sonst laufen die "gepaarten" Decks
auseinander, ohne dass das irgendwo auffällt.

**Vorschlag:** Das ist der stärkste Beleg dafür, dass ein Datenmodell statt zehn Klassen
angemessener ist (siehe Befund 3) — im Minimalfall reicht es schon, die 5 Karten-Maps als
benannte Konstanten zu extrahieren und von beiden Klassen eines Paares zu referenzieren,
z.B. `const BARBAR_GLADIATOR_DECK = new Map([...])`, importiert in beiden Dateien. Besser
ist aber der vollständige Umbau aus Befund 3, weil er beide Duplikationsarten
(Konstruktor-Code *und* Karten-Daten) auf einmal auflöst.

### 3. Open/Closed-Verstoß: neuer Heldentyp erfordert neue Klasse + neue Datei (SOLID, wichtig)

**Betroffene Dateien:** alle Dateien in `src/models/helden/` plus jede Stelle, die alle
Helden referenziert (außerhalb des Scopes dieser Datei, aber relevant für die Abwägung,
z.B. `heropower-selector`-Komponenten, die laut `CLAUDE.md` je Heldentyp Fallunterscheidungen
enthalten dürften).

**Problem:** Aktuell ist "ein neuer Held" gleichbedeutend mit "eine neue `.class.ts`-Datei,
die von `Hero` erbt und `Herointerface` implizit über Duplikat-Code erfüllt". Das
widerspricht dem Open/Closed-Prinzip: Um das System um ein neues Datenobjekt (einen Helden)
zu erweitern, muss Code (eine neue Klasse) hinzugefügt werden statt nur Konfiguration. Die
Klassenhierarchie trägt hier keine unterscheidbare *Verhaltens*-Logik — kein `override`
einer Methode, keine heldenspezifische Berechnung in den Klassen selbst (die eigentliche
Heropower-Logik liegt laut `CLAUDE.md` ohnehin in den Komponenten, nicht in den
Helden-Klassen). Die Vererbung bildet also nur Daten ab, nicht Verhalten — ein Fall, in
dem Vererbung die falsche Abstraktion ist.

**Abwägung:**

*Datengetriebener Ansatz (eine `Hero`-Klasse/Factory + Konfigurationsliste):*
- Vorteile: Ein neuer Held = ein neuer Eintrag in einem Array/JSON, keine neue Datei, kein
  Duplikat-Risiko wie in Befund 2, einfacher zu testen (eine Factory-Funktion statt 10
  Konstruktoren), leichter aus Firestore/Config nachladbar, falls Heldendaten später extern
  gepflegt werden sollen.
- Nachteile: Verliert die Möglichkeit, heldenspezifisches *Verhalten* typsicher zu
  überschreiben, falls das je gebraucht wird (aktuell nicht der Fall — die Klassen haben
  keine überschriebenen Methoden außer Feldern); TypeScript-Autovervollständigung für
  "gibt es `Barbar` wirklich" geht verloren zugunsten eines String-Keys (kann man mit einem
  `enum`/Union-Type für `HeroId` abfedern).

*Bestehender Klassenansatz beibehalten, nur DRY fixen (Befund 1):*
- Vorteile: Kleinerer, risikoärmerer Change (passt zur "kleine, verifizierbare Schritte"-
  Vorgabe aus `CLAUDE.md`), keine Migration der Call-Sites nötig, die vermutlich per
  `new Barbar()` oder Typ `Barbar` auf die Klassen zugreifen.
- Nachteile: Löst Befund 3 (OCP) nicht, nur Befund 1 (DRY im Konstruktor).

**Empfehlung:** Für dieses Projekt (Hobby-/kleines Spiel, laut `CLAUDE.md` "kleine,
verifizierbare Schritte") zunächst Befund 1 umsetzen (risikoarm, sofort spürbarer DRY-Gewinn),
danach als separater, bewusst geplanter Schritt auf Konfigurationsobjekte umstellen:

```ts
// hero-definitions.ts (neu, Beispielskizze)
export interface HeroDefinition {
    id: string;              // z.B. 'barbar' — Enum/Union-Type statt freiem String
    heroName: string;
    heroPower: string;
    description: string;
    cardCounts: Map<string, number>;
}

export const HERO_DEFINITIONS: HeroDefinition[] = [
    { id: 'barbar', heroName: 'Barbar', heroPower: 'Schlagkräftige Argumente',
      description: '...', cardCounts: new Map([['red', 5], /* ... */]) },
    // ...
];

// eine einzige Hero-Klasse/Factory statt 10 Unterklassen
export function createHero(id: string): Hero {
    const def = HERO_DEFINITIONS.find(h => h.id === id);
    if (!def) throw new Error(`Unbekannter Heldentyp: ${id}`);
    const hero = new Hero();
    hero.heroName = def.heroName;
    hero.heroPower = def.heroPower;
    hero.description = def.description;
    hero.cardstack = hero.buildCardstack(def.cardCounts);
    return hero;
}
```

Dieser Umbau betrifft aber auch Call-Sites außerhalb dieses Scopes (Komponenten, die
`new Barbar()` o.ä. aufrufen) — nicht in dieser Review-Datei behandelt, siehe die
Komponenten-Review-Abschnitte.

### 4. `shuffle()` ist unreiner Zufall ohne DI — schwer testbar (Typisierung/Stabilität, wichtig)

**Betroffene Dateien:** `src/models/helden/hero.class.ts:26-42` (Definition), verwendet in
allen 10 Heldenklassen (siehe Befund 1) sowie strukturell dupliziert in
`src/models/monster/monster.class.ts:449-467` als Instanzmethode `Monster.shuffle()`.

**Problem:**
- `shuffle` in `hero.class.ts:26` ruft direkt `Math.random()` auf (`hero.class.ts:33`) —
  es gibt keine Möglichkeit, das Zufallsverhalten in einem Test zu kontrollieren (z.B. zu
  prüfen "der Stapel enthält nach dem Shuffle noch alle ursprünglichen Karten" ist möglich,
  aber "der Stapel hat eine bestimmte Reihenfolge" nicht deterministisch testbar).
- Die Funktion ist in `hero.class.ts` **und** nochmal fast identisch als Methode in
  `monster.class.ts:449-467` implementiert (Fisher-Yates, wortgleicher Algorithmus, nur
  Parametertyp `string[]` vs. `object[]`) — ein weiteres, kleineres DRY-Duplikat quer über
  die beiden Modell-Bereiche.
- Kein Interface/keine injizierbare `Rng`-Abstraktion; ein Unit-Test für
  "erzeugt Barbar einen Stapel mit 34 Karten" ist möglich, aber "ist die Reihenfolge
  reproduzierbar" nicht.

**Vorschlag:**
- `shuffle` einmalig in eine gemeinsame Utility-Datei auslagern (z.B.
  `src/models/shuffle.util.ts`) und von `hero.class.ts` **und** `monster.class.ts`
  importieren statt zweimal zu implementieren.
- Optional (nice-to-have, nur falls Determinismus in Tests wirklich gebraucht wird): eine
  RNG-Quelle als Parameter mit Default injizierbar machen, z.B.
  `shuffle<T>(array: T[], rng: () => number = Math.random): T[]`. Das erlaubt in Tests
  `shuffle(arr, () => 0.5)` für ein deterministisches Ergebnis, ohne die Signatur für
  Aufrufer im Produktivcode zu ändern (Default bleibt `Math.random`).

### 5. `monster.class.ts` — 474 Zeilen, davon ~85 % reine Datenliterale (God-Class-Verdacht, wichtig)

**Betroffene Datei:** `src/models/monster/monster.class.ts`

**Problem:** Die Datei mischt drei unterschiedliche Verantwortlichkeiten in einer Klasse:
1. **Reine Stammdaten** (`questCollection` Z.117-168, `bossCollection` Z.170-244,
   `monsterCollection` Z.246-447 — zusammen ~330 von 474 Zeilen, also ~70 % der Datei).
   Das ist per Definition JSON-fähige Konfiguration ohne jede Logik (auch etliche
   auskommentierte Mini-Boss-Einträge, z.B. Z.118-127, 148-152, 158-167 — toter Code, der
   aufgeräumt oder in ein separates "geplante Inhalte"-Dokument verschoben gehört).
2. **Auswahl-/Schwierigkeitslogik** (`createMob` Z.12-59): eine tief verschachtelte
   If/Else-Kaskade, die pro Boss-Namen (als String verglichen, Z.14/25/33/41) und
   Schwierigkeitsgrad (als String verglichen, `'easy'`/`'medium'`/Default, Z.17/20/26/29/...)
   feste Zahlenwerte auswählt. 5 Bosse × 3 Schwierigkeitsgrade = 15 Zweige, jeder ruft
   `getMonsterForGame` mit 9 Positionsargumenten auf (Z.18, 21, 23, 27, ...) — bei einem
   neuen Boss oder einer vierten Schwierigkeitsstufe wächst diese Kaskade weiter linear statt
   deklarativ.
3. **Mechanik** (`getMonsterForGame` Z.61-93, `loadMonster` Z.95-104, `loadQuests`
   Z.106-115, `shuffle` Z.449-467): eigentliche Auswahl-/Misch-Algorithmen.

**Ist das gerechtfertigt?** Die Zeilenzahl allein ist kein Problem (Datenlisten sind lang,
weil das Spiel viele Monster hat), aber die Vermischung von *Daten* und *Verhalten* in
einer Klasse ist ein SRP-Verstoß: Wer die Monsterliste pflegen will (Spieldesign-Aufgabe),
muss dieselbe Datei bearbeiten wie jemand, der die Schwierigkeitslogik ändert
(Programmieraufgabe) — Merge-Konflikte und Diff-Rauschen sind vorprogrammiert (474-Zeilen-
Diffs für eine einzelne neue Monsterkarte).

**Vorschlag:**
- `questCollection`, `bossCollection`, `monsterCollection` in eigene Datendateien
  auslagern (z.B. `src/models/monster/data/monster-collection.data.ts` etc., oder als
  `.json` mit Typimport), die `Monster`-Klasse importiert sie nur noch. Reduziert
  `monster.class.ts` auf die ~140 Zeilen tatsächliche Logik.
- `createMob`s If/Else-Kaskade durch eine Konfigurationstabelle ersetzen (Boss-Name →
  Schwierigkeitsstufe → 4er-Tupel `[monsterCount, questCount]` je Spielerzahl), z.B. ein
  verschachteltes Objekt/`Map`, aus dem `createMob` nur noch nachschlägt statt 15 Zweige
  hart zu kodieren. Macht das OCP-Problem (neuer Boss = neuer Zweig in jeder Difficulty)
  zu "neuer Eintrag in einer Tabelle".
- `getMonsterForGame`s 9 Positionsparameter (`monsterTwo`, `questTwo`, `monsterThree`, ...)
  sind fehleranfällig (Vertauschungsrisiko bei 9 gleichartigen `number`-Parametern in
  Folge) — ein Objekt- oder Array-Parameter (`{2: {monster: 10, quest: 4}, 3: {...}, ...}`)
  wäre selbsterklärender und bräuchte keine Positionsdisziplin.

### 6. Bug: Zuweisung statt Vergleich in `createMob` (Korrektheit, kritisch — Bonusfund)

**Betroffene Datei:** `src/models/monster/monster.class.ts:14-16`

**Problem:**
```ts
if (
  currentBoss.bossname == 'Baby-Barbar' ||
  (currentBoss = 'Baby-barbar')      // Zuweisung (=), kein Vergleich (==)!
) {
```
`(currentBoss = 'Baby-barbar')` ist eine **Zuweisung**, kein Vergleich (fehlendes `=`,
zusätzlich falsche Groß-/Kleinschreibung ggü. `'Baby-Barbar'` weiter oben — spricht dafür,
dass ursprünglich ein `===`-Vergleich gemeint war). Der Ausdruck ist als Zuweisung immer
"truthy" (ein nicht-leerer String), das `||` macht die gesamte Bedingung **immer wahr** —
der erste `if`-Zweig wird also für *jeden* `currentBoss`-Wert genommen, alle folgenden
`else if`-Zweige (Z.25, 33, 41) sind unerreichbarer Code. Zusätzlich wird als Nebeneffekt
der Parameter `currentBoss` (Typ `any`, siehe Befund 7) auf den String `'Baby-barbar'`
überschrieben — verändert einen Aufrufparameter, was in einer reinen "wähle Monsterzahl"-
Funktion überrascht.

**Vorschlag:** Zu `currentBoss.bossname == 'Baby-Barbar'` korrigieren (das `||
(currentBoss = 'Baby-barbar')` ersatzlos streichen). Das ist kein DRY/SOLID-Befund, sondern
ein funktionaler Bug, der aber direkt im Scope dieser Review-Datei liegt und die gesamte
Schwierigkeits-/Boss-Logik der Monsterauswahl aktuell wirkungslos macht (immer derselbe
Zweig) — daher hier mit aufgenommen statt stillschweigend übergangen.

### 7. Typisierung: `any` und Magic Strings ohne Enum/Const (Typisierung/Naming, wichtig)

**Betroffene Dateien:**
- `src/models/monster/monster.class.ts:12` — `createMob(numberOfPlayers: number,
  currentBoss: any, difficulty: string)`: `currentBoss: any` verhindert, dass der Compiler
  `currentBoss.bossname` (Z.14 u.a.) validiert; hätte den Bug aus Befund 6 vermutlich nicht
  verhindert, aber wäre bei `currentBoss: Mob` (oder einem passenderen Boss-Interface mit
  `bossname`-Feld — zu beachten: `Mob` hat aktuell `name`, nicht `bossname`, siehe
  `monster.class.ts:1-5` vs. `:14` — ein weiteres Indiz für den Bug: das Feld heißt im
  `Mob`-Interface `name`, nicht `bossname`, `currentBoss.bossname` ist also vermutlich
  *immer* `undefined`, was Befund 6 zusätzlich verschärft) sofort als Typfehler aufgefallen.
- `difficulty: string` (`monster.class.ts:12`) statt Union-Type `'easy' | 'medium' |
  'hard'` — der Default-Zweig (`else`, z.B. Z.30) fängt sowohl `'hard'` als auch jeden
  Tippfehler ab, ohne dass der Compiler warnt.
- Kartennamen als freie Strings ohne Enum/Const, z.B. `'wut'`, `'riesensprung_hindernis'`
  (`barbar.class.ts:22-23`), `'rücklings_person'`, `'stehlen'`, `'spende'`
  (`dieb.class.ts:20-22`), `'magischeBombe'` (`magier.class.ts:21`, camelCase — inkonsistent
  zu den sonst snake_case-artigen Namen wie `riesensprung_hindernis`). Ein Tippfehler in
  einem Kartennamen (z.B. `'riesensprung_hinderniss'` mit doppeltem `s`) fällt weder beim
  Kompilieren noch beim Testen auf, weil `cardstack: string[]` jeden String akzeptiert.
- `Herointerface` (`hero.class.ts:1-5`) wird von keiner der 10 Heldenklassen implementiert
  (`class Barbar extends Hero`, nicht `implements Herointerface`) und hat auch andere
  Feldnamen (`choosenHero` vs. `heroName`) — totes/inkonsistentes Interface.

**Vorschlag:**
- `currentBoss: Mob` statt `any` (oder ein dediziertes `Boss extends Mob`-Interface, falls
  Bosse zusätzliche Felder brauchen); Zugriff über `currentBoss.name`, nicht `bossname`
  (siehe Bug-Zusammenhang oben).
- `difficulty: 'easy' | 'medium' | 'hard'` als Union-Type.
- Kartennamen als `const enum CardType` oder `as const`-Objekt zentral definieren (z.B.
  `src/models/helden/card-type.const.ts`), von allen Heldenklassen und ggf. den
  Komponenten importiert, die auf Kartennamen prüfen. Reduziert Tippfehlerrisiko und macht
  "welche Kartennamen gibt es überhaupt" an einer Stelle nachschlagbar statt über 10 Dateien
  verteilt zu raten.
- `Herointerface` entweder tatsächlich von `Hero` implementieren lassen (Felder angleichen)
  oder entfernen, falls es nirgends im Repo verwendet wird.

### 8. Naming: Deutsch/Englisch-Mix (nice-to-have, laut `CLAUDE.md` bewusst nicht vereinheitlichen)

**Betroffene Dateien:** durchgängig in `src/models/helden/*.class.ts` (`heroCards`,
`cardstack`, `heroPower` vs. Kartennamen wie `'wut'`, `'stehlen'`, `'heiltrank'`) und
`src/models/monster/monster.class.ts` (`Mob`, `token`, `type` vs. `type: 'Hindernis'`,
`'Person'`, `'Monster'` als Werte).

**Problem:** Klassen-/Feldnamen sind Englisch, Domänendaten (Kartennamen, Monsternamen,
Beschreibungen) sind Deutsch — konsistent inkonsistent über das ganze Modell-Verzeichnis,
kein Einzelfall einer bestimmten Datei.

**Vorschlag:** Laut `CLAUDE.md` ("beim Umbau nicht zusätzlich vereinheitlichen, wenn nicht
explizit beauftragt") hier **keine** Umbenennung vorschlagen — nur dokumentiert als
Kontext für Befund 7 (die Magic-String-Konstanten sollten, falls sie eingeführt werden,
bei den bestehenden deutschen Kartennamen bleiben, nicht zusätzlich übersetzt werden).

## Priorisierte Empfehlungen

1. **Kritisch — Bug in `createMob` beheben** (Befund 6): `currentBoss.bossname == 'Baby-Barbar'
   || (currentBoss = 'Baby-barbar')` korrigieren; zusätzlich prüfen, ob `bossname` überhaupt
   das richtige Feld ist (`Mob.name`, Befund 7) — vermutlich zwei zusammenhängende Bugs, die
   die gesamte Boss-abhängige Schwierigkeitsauswahl aktuell wirkungslos machen. Kleiner,
   isolierter Fix, sollte zuerst und unabhängig von den übrigen Punkten passieren.
2. **Kritisch — `buildCardstack`-Extraktion in `Hero`** (Befund 1): risikoarmer erster
   DRY-Schritt, entfernt ~90 Zeilen Duplikat-Code, ändert an keiner Klassen-API etwas.
3. **Wichtig — Karten-Deck-Duplikate auflösen** (Befund 2): entweder als benannte
   Konstanten pro Paar oder direkt im Zuge von Punkt 4.
4. **Wichtig — Datengetriebener Helden-Ansatz** (Befund 3): größerer, bewusst zu planender
   Schritt (Call-Sites außerhalb dieses Scopes betroffen); löst Befund 1 und 2 strukturell
   mit.
5. **Wichtig — `monster.class.ts` entflechten** (Befund 5): Daten aus der Klasse in
   separate Datendateien auslagern, `createMob`-Kaskade tabellarisieren.
6. **Wichtig — Typisierung schärfen** (Befund 7): `any` entfernen, Union-Types für
   `difficulty`, Enum/Const für Kartennamen.
7. **Nice-to-have — `shuffle` konsolidieren und optional RNG injizierbar machen**
   (Befund 4): einmalige Utility-Funktion statt zweier Implementierungen; RNG-Parameter nur,
   falls deterministische Tests tatsächlich gebraucht werden.
8. **Nice-to-have — totes `Herointerface`** (Teil von Befund 7) entfernen oder angleichen.
