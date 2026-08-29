# Refactoring-Plan: Helden-Datenmodell statt zehn Klassen

Kontext: Punkt 6 der „Empfohlenen Reihenfolge" aus
`docs/done/review-2026-08/00-overview.md`, Detailbefunde 2/3 in
`docs/done/review-2026-08/05-models.md`. Befund 1 aus derselben Datei (identischer
Konstruktor-Aufbau) ist bereits in PR #21 über `Hero.buildCardstack()` gelöst — dieser Plan
baut direkt darauf auf und behandelt den nächsten, größeren Schritt. Stand der Diagnose:
2026-08-29, nach PR #21.

## Diagnose

`src/models/helden/` enthält zehn Klassen (`barbar.class.ts`, `dieb.class.ts`,
`gladiator.class.ts`, `jägerin.class.ts`, `magier.class.ts`, `ninja.class.ts`,
`paladin.class.ts`, `waldläufer.class.ts`, `walküre.class.ts`, `zauberin.class.ts`), jede
`extends Hero` (`hero.class.ts`) und überschreibt nur vier Felder: `heroName`, `heroPower`,
`description`, `cardstack` (über `this.cardstack = this.buildCardstack(new Map([...]))` im
Konstruktor). Keine der Klassen hat eigenes *Verhalten* — keine überschriebene Methode, kein
`override` von irgendetwas außer Feldern. Die Vererbung bildet nur Daten ab.

**Karten-Decks sind paarweise identisch**, nicht nur strukturell ähnlich — geprüft nach PR #21,
weiterhin zutreffend:
- `barbar.class.ts` und `gladiator.class.ts`: identische `Map`-Einträge (`red:5, yellow:7,
  green:5, blue:3, purple:6, red_purple:2, red_blue:2, red_green:2, red_red:2, red_yellow:2,
  wut:2, riesensprung_hindernis:2`).
- `dieb.class.ts` und `ninja.class.ts`: identisch (`red:7, yellow:5, green:3, blue:6,
  purple:7, purple_purple:3, sprint_hindernis:3, rücklings_person:3, stehlen:2, spende:1`).
- `jägerin.class.ts` und `waldläufer.class.ts`: identisch (`red:4, yellow:3, green:9, blue:4,
  purple:7, green_green:2, joker:8, heilkräuter:2, treffer_person:1`).
- `paladin.class.ts` und `walküre.class.ts`: identisch (`red:6, yellow:9, green:6, blue:8,
  purple:3, yellow_yellow:2, heiligeHandgranate:1, göttlicherSchild:2, heiltrank:2, heile:1,
  haudrauf_monster:1`).
- `magier.class.ts` und `zauberin.class.ts`: identisch (`red:3, yellow:5, green:7, blue:9,
  purple:6, blue_blue:2, verhinderung_event:1, feuerball_monster:4, magischeBombe:3`).

Nur `heroName`/`heroPower`/`description` unterscheiden die beiden Klassen eines Paares —
dieselbe Datenmenge wurde als Code zweimal eingetippt.

**Einziger Konstruktions-Call-Site**: `DialogChooseHeroComponent`
(`src/app/components/dialog-choose-hero/dialog-choose-hero.component.ts:37-46`) instanziiert
alle zehn Klassen (`new Barbar`, `new Dieb`, ...) als Feld, ruft `.toJSON()`
(`hero.class.ts:27-35`) darauf auf und baut daraus die `heros: Heros[]`-Liste
(`dialog-choose-hero.component.ts:49-60`) fürs Auswahl-Dropdown. `getChoosenHero()`
(`:64-68`) liest aus dem gewählten Eintrag `.value.heroName`/`.heroPower`/`.cardstack`/
`.description` und schließt den Dialog mit `{data: {choosenHero: {...}}}`. Das ist die
**einzige** Stelle im Code, die eine der zehn Klassen instanziiert — kein anderer Konsument
(`heropower.component.ts` und `heropower-container.component.ts` prüfen nur noch den
`choosenHero`-**Namen** als String, nicht den Klassentyp).

`Herointerface` (`hero.class.ts:3-7`) wird von keiner der zehn Klassen `implements` — sie
nutzen `extends Hero`, nicht `implements Herointerface` — und hat auch andere Feldnamen
(`choosenHero` statt `heroName`). Totes/inkonsistentes Interface.

## TODOs

- [ ] **TODO 1 — Konfigurationsdaten definieren**
  - Neue Datei `src/models/helden/hero-definitions.ts`:
    ```ts
    export interface HeroDefinition {
      id: string;              // z.B. 'barbar' — als Union-Type der zehn bekannten IDs
      heroName: string;
      heroPower: string;
      description: string;
      cardCounts: Map<string, number>;
    }
    export const HERO_DEFINITIONS: HeroDefinition[] = [ /* zehn Einträge, Daten 1:1 aus den
      bestehenden zehn Klassen übernehmen — bei den fünf identischen Paaren (siehe Diagnose)
      eine gemeinsame Map-Konstante referenzieren statt sie zweimal zu tippen */ ];
    ```
  - Die Daten müssen exakt den aktuellen `cardCounts`/`heroPower`/`description`-Werten der
    zehn Klassen entsprechen — beim Übertragen genauso verifizieren wie in PR #21 beim Verschieben
    von `monster.class.ts`s Datenliteralen (Feld-für-Feld-Diff gegen die bestehenden Dateien,
    nicht nur visuell prüfen).
  - Verifikation: `ng build` (noch keine funktionale Änderung, `HERO_DEFINITIONS` wird noch
    nirgends gelesen).

- [ ] **TODO 2 — `Hero` um eine Factory-Funktion ergänzen**
  - `hero.class.ts`: `export function createHero(id: string): Hero` liest die passende
    `HeroDefinition` aus `HERO_DEFINITIONS`, setzt `heroName`/`heroPower`/`description` und
    `cardstack = new Hero().buildCardstack(def.cardCounts)` (die in PR #21 eingeführte Methode
    bleibt unverändert nutzbar).
  - Unbekannte `id` wirft einen Fehler (`Unbekannter Heldentyp: ${id}`) statt `undefined`
    zurückzugeben — Aufrufer (`DialogChooseHeroComponent`) muss damit nicht umgehen, weil die
    Liste der IDs aus `HERO_DEFINITIONS` selbst kommt (siehe TODO 3).
  - Verifikation: `ng build`, neuer Unit-Test für `createHero()` — „erzeugt Held mit erwarteter
    `cardstack`-Länge je ID", „wirft bei unbekannter ID".

- [ ] **TODO 3 — `DialogChooseHeroComponent` auf die Factory umstellen**
  - Zehn `Barbar`/`Dieb`/... -Importe und -Felder (`dialog-choose-hero.component.ts:4-13,
    37-46`) entfernen.
  - `heros: Heros[]` (`:49-60`) wird aus `HERO_DEFINITIONS.map(def => ({ value:
    createHero(def.id).toJSON(), viewValue: def.heroName }))` generiert — neue Helden brauchen
    ab hier nur noch einen neuen `HERO_DEFINITIONS`-Eintrag, keine neue Datei/Klasse/Import.
  - `getChoosenHero()` (`:64-68`) bleibt inhaltlich unverändert (liest weiterhin
    `.value.heroName`/`.heroPower`/`.cardstack`/`.description` — die Form von `.toJSON()`
    ändert sich durch TODO 2 nicht).
  - Verifikation: `ng build`, `ng test`, manueller Test „Helden-Auswahl-Dialog öffnen, alle
    zehn Helden sind wählbar, gewählter Held erscheint korrekt im Spiel (Name, Kartenanzahl,
    Beschreibung)".

- [ ] **TODO 4 — Zehn Klassen-Dateien entfernen**
  - `barbar.class.ts` … `zauberin.class.ts` löschen, sobald TODO 3 gemergt ist und `grep -rn
    "from ['\"]src/models/helden/(barbar|dieb|gladiator|jägerin|magier|ninja|paladin|
    waldläufer|walküre|zauberin)\.class['\"]"` im gesamten `src/` keine Treffer mehr liefert.
  - `Herointerface` (`hero.class.ts:3-7`) entweder löschen (unbenutzt, siehe Diagnose) oder an
    `HeroDefinition` angleichen, falls es doch irgendwo als öffentlicher Typ für Konsumenten
    außerhalb dieses Moduls gedacht war — vor dem Löschen kurz `grep -rn Herointerface src/`
    gegenprüfen.
  - Verifikation: `ng build`, `ng test`, `npm run test:rules` (unberührt, reine
    Modell-/Komponentenänderung ohne Firestore-Struktur-Änderung).

## Verifikation (gesamter Plan)

- `ng build` und `ng test --watch=false --browsers=ChromeHeadlessCI` nach jedem TODO grün.
- Manueller Test vor dem finalen Merge: alle zehn Helden im Auswahl-Dialog durchspielen (nicht
  nur anwählen — mindestens eine Karte pro Held tatsächlich ziehen, um zu verifizieren, dass
  `cardstack`/`buildCardstack()` weiterhin die erwartete Kartenanzahl und -verteilung liefert).

## Nicht im Scope

- Karten-Namen als Enum/Const statt freier Strings (Befund 7 in
  `docs/done/review-2026-08/05-models.md`, „wichtig", aber unabhängig von der
  Klassen-zu-Config-Umstellung — kann vorher, nachher oder separat passieren).
- Das Heropower-Strategy-Pattern (`docs/done/player-hand-decomposition-plan.md`, TODO 5,
  Stretch-Goal) — dieser Plan schafft die Datengrundlage dafür (`HeroDefinition` ließe sich um
  ein `activatesOn`-Feld erweitern), setzt sie aber nicht selbst um.
- `monster.class.ts`s `createMob`-Kaskade tabellarisieren (Rest von Befund 5 in
  `docs/done/review-2026-08/05-models.md`) — betrifft dieselbe Datei-Familie
  (`src/models/monster/`), ist aber ein eigenständiger, unabhängiger Schritt.

## Referenzen

- `docs/done/review-2026-08/05-models.md` — vollständige Befundliste (Befund 1 bereits in
  PR #21 erledigt, Befund 6 war bereits vor dem Review behoben; Befund 2/3 sind hier relevant).
- `src/models/helden/hero.class.ts` — `Hero.buildCardstack()`, in PR #21 eingeführt, bleibt in
  diesem Plan unverändert nutzbar.
- `src/models/monster/monster-collection.data.ts` — Vorbild aus PR #21 für „Datenliterale in
  eine eigene Datei auslagern, Verhalten bleibt in der Klasse/Funktion".
