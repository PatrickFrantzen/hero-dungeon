# heropower/ — Container/Presenter-Paar

- **`heropower-container/heropower-container.component.ts`** — liest allen nötigen Store-State
  (Gegner, Spieler, Ablagestapel, aktive Heropower) und entscheidet per `effect()`, **wann**
  eine Heropower auflöst (Heldenname + `heropowerArray.length == 3` + `heropowerActivated()`).
  Löst die Fähigkeit aber nicht selbst auf, außer beim Dieb (`DiebService.heropower(...)` direkt
  aufgerufen) — für die anderen Helden emittiert es `heropowerResolved` (`'array' | 'jaegerin' |
  'walkuere' | 'magier'`), das **wie** wird von `PlayerHandComponent` behandelt, weil dort die
  Hand-/Kartenstapel-Signale liegen, die dieser Container nicht hat. Referenz-Beispiel für das
  Signal-Pattern (`input()`/`output()`/`computed()`/`effect()`) im gesamten Projekt.
  Magier "Zeit einfrieren" (`case 'Magier':` → `heropowerResolved.emit('magier')` →
  `HeropowerService.resolveMagierHeropower()`) pausiert zusätzlich den Dungeon-Timer — Details
  zum Gesamt-Feature (inkl. Walküre/Paladin "Göttlicher Schild") in
  `src/app/components/game/CLAUDE.md`.
- **`heropower.component.ts`** (+ `.html`/`.scss`) — reine Darstellung. Seit Issue #49 kein
  permanentes Overlay mehr: ein immer sichtbarer `.heropower-fab`-Button (unten rechts,
  außerhalb der Handkarten-Fächerreihe) toggelt ein lokales `sheetOpen`-Signal, das die
  eigentliche Heropower-Karte (`.heropower-sheet`, vormals `.heropower-position`) als
  Bottom-Sheet ein-/ausblendet. `heropowerActivated()` (Store-State) steuert weiterhin
  `color-effect` auf der Karte selbst und zusätzlich einen gelben Ring auf dem FAB
  (`.heropower-fab--active`), damit eine aktive Fähigkeit auch bei geschlossenem Sheet sichtbar
  bleibt. Reine UI-Präsentation.

## Aktivierungs-Icon + vereinheitlichter Klick-Handler (Issue #93, 2026-09-04)

`heropower.component.html` zeigte pro Held bisher ein anderes, sachfremd wiederverwendetes
Icon aus `assets/img/icons/` (z.B. `person_icon.png`/`monster_icon.png`/`hindernis_icon.png` -
eigentlich die Encounter-Kategorie-Icons aus `player-hand/singleTargetActionCards`-Kontext, nicht
für Heldenfähigkeiten gedacht), dann (Live-Test-Fix, 2026-09-03) auf zehn strukturell identische
`@if (heroName() == '...')`-Zweige mit demselben Icon (`heldenfaehigkeit_icon.png`, von Patrick
geliefertes Artwork, per Python/Pillow zugeschnitten + auf 160×160px reduziert + 256-Farben-
quantisiert - exakt dasselbe Verfahren wie bei den Enemy-Kategorie-Icons, siehe `enemy/CLAUDE.md`,
daher optisch im selben "geprägte Münze auf Holz"-Stil) umgestellt. Diese zehn Zweige nutzten
`src="../../../assets/img/icons/..."` (drei Verzeichnisebenen relativ nach oben) - unter Angular
Client-Side-Routing löst der Browser das relativ zur aktuellen URL-Route auf, nicht relativ zur
`index.html`, was unter GitHub Pages (Unterordner-Deployment, siehe Root-`CLAUDE.md`) zu einem
404 führte. Jetzt: **ein einziges** `<img src="./assets/img/icons/heldenfaehigkeit_icon.png">`
(Pfad-Muster analog zu `player-hand/`/`enemy/`, die bereits `./assets/img/...` nutzen und
nachweislich funktionieren) mit einem gemeinsamen `(click)="onActivateHeropower()"`.
`heropower.component.scss` setzt weiterhin `img { width/height: clamp(...) }` auf
`.heropower-sheet` für die 160px-Icon-Größe.

## Aktivierungs-/Auflösungsregeln datengetrieben statt zwei duplizierten Switches (TODO 5, 2026-09-05)

`onActivateHeropower()` schlug bis dahin `heroName()` in einer `heroPowerHandlers`-Lookup-Tabelle
nach und delegierte an eine von zehn strukturell identischen `heroPower<Name>()`-Methoden, die
sich nur im geprüften `currentEnemy().type`-Wert unterschieden. Parallel dazu hatte
`HeropowerContainerComponent`s `effect()` einen zweiten `switch (heroname)`, der entschied,
**welches** Auflösungs-Ereignis ein Held auslöst — dieselbe Art Duplikation auf einer anderen
Achse. Beide Switches sind jetzt durch zwei Datenfelder auf `HeroDefinition`
(`src/models/helden/hero-definitions.ts`, siehe `src/models/CLAUDE.md`) ersetzt, statt einer
neuen `HeropowerStrategy`-Klassenhierarchie einzuführen (Rückschritt gegen das dort bereits
etablierte konfigurationsbasierte Heldenmodell):

```ts
activatesOn: 'Person' | 'Monster' | 'Hindernis' | 'always';
resolutionKind: 'array' | 'magier' | 'jaegerin' | 'walkuere' | 'dieb';
```

`onActivateHeropower()` schlägt `HERO_DEFINITIONS` per `heroName()` nach und toggelt
`activateHeroPower()`/`deactivateHeroPower()` anhand von `activatesOn` (`'always'` = wie die
vorherigen Magier/Jägerin/Dieb/Walküre-Methoden ohne Typ-Check) — die zehn `heroPower*()`-
Methoden und die Lookup-Tabelle sind komplett entfallen. `HeropowerContainerComponent`s
`effect()` schlägt denselben `HERO_DEFINITIONS`-Eintrag nach `resolutionKind` nach;
`resolutionKind === 'dieb'` bleibt der einzige Sonderfall (`DiebService.heropower(...)` statt
`heropowerResolved.emit(...)`, da Dieb nie über dieses Output läuft).

Neue Heldenfähigkeit hinzufügen: **kein** neuer Code mehr in `heropower.component.ts`/
`heropower-container.component.ts` nötig — nur `activatesOn`/`resolutionKind` (plus die
übrigen Felder) auf dem neuen `HeroDefinition`-Eintrag setzen. Ein Held mit eigenem
Auflösungsweg wie Dieb bräuchte weiterhin einen eigenen Sonderfall im Container, falls er wie
Dieb nicht über `heropowerResolved` laufen soll.
