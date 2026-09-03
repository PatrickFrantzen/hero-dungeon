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
  bleibt. Reine UI-Präsentation — `activateHeroPower()`/`deactivateHeroPower()`/die zehn
  `heroPower*()`-Methoden sind unverändert.

## Aktivierungs-Icon (Live-Test-Fix, 2026-09-03)

`heropower.component.html` zeigte pro Held bisher ein anderes, sachfremd wiederverwendetes
Icon aus `assets/img/icons/` (z.B. `person_icon.png`/`monster_icon.png`/`hindernis_icon.png` -
eigentlich die Encounter-Kategorie-Icons aus `player-hand/singleTargetActionCards`-Kontext, nicht
für Heldenfähigkeiten gedacht). Alle zehn `@if`-Zweige nutzen jetzt einheitlich
`assets/img/icons/heldenfaehigkeit_icon.png` (von Patrick geliefertes Artwork, per Python/
Pillow zugeschnitten + auf 160×160px reduziert + 256-Farben-quantisiert - exakt dasselbe
Verfahren wie bei den Enemy-Kategorie-Icons, siehe `enemy/CLAUDE.md`, daher optisch im selben
"geprägte Münze auf Holz"-Stil). `heropower.component.scss` setzt `img { width/height: clamp(...)
}` auf `.heropower-sheet`, weil die 160px-Icons sonst deutlich größer als die vorherigen
~90-100px-Icons rendern würden (kein Rendering davor, es galt die native Pixelgröße). Ein neuer
Held braucht denselben Icon-Pfad, keinen eigenen.

Neue Heldenfähigkeit hinzufügen: Prüf-Logik (das "ob überhaupt auflösen") gehört primär in
`HeropowerService` (`services/CLAUDE.md`, dort auch der Hinweis auf die bewusst nicht
vereinheitlichten Sonderfälle), das "wann im Container reagieren" folgt dem bestehenden
`switch (heroname)`-Muster hier. Ein reiner Signal-/Array-Typ-Held reiht sich in den
`'array'`-Zweig ein; ein Held mit eigenem Auflösungsweg (wie Dieb/Jägerin/Walküre) braucht
einen eigenen `case`.
