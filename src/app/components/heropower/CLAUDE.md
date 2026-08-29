# heropower/ — Container/Presenter-Paar

- **`heropower-container/heropower-container.component.ts`** — liest allen nötigen Store-State
  (Gegner, Spieler, Ablagestapel, aktive Heropower) und entscheidet per `effect()`, **wann**
  eine Heropower auflöst (Heldenname + `heropowerArray.length == 3` + `heropowerActivated()`).
  Löst die Fähigkeit aber nicht selbst auf, außer beim Dieb (`DiebService.heropower(...)` direkt
  aufgerufen) — für die anderen Helden emittiert es `heropowerResolved` (`'array' | 'jaegerin' |
  'walkuere'`), das **wie** wird von `PlayerHandComponent` behandelt, weil dort die
  Hand-/Kartenstapel-Signale liegen, die dieser Container nicht hat. Referenz-Beispiel für das
  Signal-Pattern (`input()`/`output()`/`computed()`/`effect()`) im gesamten Projekt.
- **`heropower.component.ts`** (+ `.html`/`.scss`) — reine Darstellung.

Neue Heldenfähigkeit hinzufügen: Prüf-Logik (das "ob überhaupt auflösen") gehört primär in
`HeropowerService` (`services/CLAUDE.md`, dort auch der Hinweis auf die bewusst nicht
vereinheitlichten Sonderfälle), das "wann im Container reagieren" folgt dem bestehenden
`switch (heroname)`-Muster hier. Ein reiner Signal-/Array-Typ-Held reiht sich in den
`'array'`-Zweig ein; ein Held mit eigenem Auflösungsweg (wie Dieb/Jägerin/Walküre) braucht
einen eigenen `case`.
