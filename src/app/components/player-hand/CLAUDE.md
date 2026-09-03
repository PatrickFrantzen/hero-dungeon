# player-hand/ — Hotspot, vor Änderungen lesen

`PlayerHandComponent` war der zentrale Hotspot im Projekt (mischte Firestore-Zugriff, NGXS-
Dispatch, Spielregeln und UI in einer ~586-Zeilen-Klasse). Seit
`docs/planned/player-hand-decomposition-plan.md` (TODO 1–3 umgesetzt, siehe Status-Abschnitt
oben in diesem Plan) ist die Komponente auf ~195 Zeilen reduziert:

- Firestore-Sync ausgelagert in `FirestoreSyncService` (`services/CLAUDE.md`).
- Heldenfähigkeiten-Prüfung ausgelagert in `HeropowerService`.
- Karten-/Encounter-Regeln ausgelagert in `CardPlayService` (`chooseCard()` als Einstiegspunkt
  für Karten ohne weitere Nutzereingabe).

Fünf Aktionskarten (Spende, Stehlen, Heilkräuter, Wut, Heilung) brauchen vor der Auflösung einen
Zielspieler — `chooseCard(card)` fängt diese Kartennamen ab (`singleTargetActionCards`-Set bzw.
der `'wut'`-Sonderfall), öffnet `DialogHeropowerComponent` (wiederverwendet, ursprünglich nur für
Jägerins Fähigkeit-Folgedialog gedacht) und ruft erst nach dessen Schließen die passende
`CardPlayService.resolve*()`-Methode mit dem/den gewählten Zielspieler(n) auf. "Wut" braucht
zwei Zielspieler, daher zwei sequentielle Dialog-Öffnungen (`openWutDialog()`).

`isEventActive()`/`resolveEvent()` (Ereigniskarten-Button, sichtbar bei
`currentEnemy().token.includes('event')`) sind Spielerzahl-unabhängig — vor der Boss-Kampagne/
Event-Überarbeitung hießen sie `isSoloEventActive()`/`resolveSoloEvent()` und waren auf
Singleplayer beschränkt; `CardPlayService.resolveEvent()` wendet den Effekt jetzt auf alle
Spieler an, nicht nur auf den klickenden.

**Vor jeder größeren Änderung hier zuerst `docs/planned/player-hand-decomposition-plan.md`
lesen** — dort steht der aktuelle Umsetzungsstand (welche TODOs offen sind, u.a. optionale
Sub-Komponenten fürs Template und ein Heropower-Strategy-Pattern) und die Begründung für
bewusst nicht vereinheitlichte Stellen (siehe `HeropowerService`-Hinweis in
`services/CLAUDE.md`).

Diese Komponente ist der zentrale Ort, an dem Store-Dispatches, Firestore-Reads und
Spielregeln zusammenlaufen — bei jeder Änderung hier ist ein manueller Multiplayer-Smoke-Test
(Karte spielen, jede Heropower-Variante auslösen, zweiter Spieler tritt bei, Kartenstapel geht
zur Neige) sinnvoll, auch wenn `ng build`/`ng test` grün sind.

## Rasten-Button als Karten-Badge statt im Fluss (Live-Test-Fix, 2026-09-03)

`.rest-button` (nur Singleplayer, `isSingleplayer()`) sitzt jetzt `position: absolute` oben
rechts auf dem Kartenbild statt darunter im normalen Dokumentfluss. Vorher trug der Button pro
Karte zusätzliche Höhe zur `.currentHandStack`-Reihe bei - bei einer auf 7+ Karten gewachsenen
Hand (Dieb "Stehlen", Kartenstapel-Cycling) wurde die fixe `.card-area`-Leiste am unteren
Bildschirmrand dadurch so hoch, dass der Button auf kleinen Portrait-Viewports aus dem sichtbaren
Bereich rutschte. `.hand-card` hat dafür `position: relative` bekommen (Anker fürs Badge) - das
Fächer-`transform` (Rotation/Hochversatz/Skalierung, siehe unten) bleibt unverändert auf
`.hand-card` selbst, das Badge dreht/skaliert also mit der Karte mit.

## Kartenbilder der 5 Basissymbole: "Münzen"-Stil (2026-09-03)

`assets/img/cards/red.png`/`blue.png`/`green.png`/`yellow.png`/`purple.png` (die fünf Basis-
Symbolkarten: Schwert/Zauberspruch/Fernkampf/Verteidigung/Beweglichkeit) sind auf von Patrick
geliefertes Artwork im "geprägte Münze auf Holz"-Stil umgestellt (gleiche Bildsprache wie
`enemy/CLAUDE.md` Kategorie-Icons und `heropower/CLAUDE.md` Aktivierungs-Icon) — per Pillow auf
450px Breite (Seitenverhältnis des Quellbilds beibehalten, ~450×650px) reduziert und
256-Farben quantisiert. Dateinamen unverändert, daher keine Code-Änderung nötig (`currentHand()`
referenziert Karten weiterhin über den String-Namen, `player-hand.component.html:
src="./assets/img/cards/{{card}}.png"`).

**Bewusste Inkonsistenz:** Die Kombi-Karten (`red_red.png`, `red_blue.png`,
`yellow_yellow.png`, `purple_purple.png`, `blue_blue.png`, `green_green.png`) sind eigenständige
Bilddateien, keine programmatisch aus den Einzelsymbolen zusammengesetzten Grafiken — sie
bleiben vorerst im alten Diagonal-Schnitt-Stil, bis auch dafür neues Artwork vorliegt.

## Swipe-Geste zum Karte-Spielen (Issue #52)

Zusätzlich zu `(click)` auf dem Handkarten-`<img>` (weiterhin die primäre, verlässliche
Interaktion) gibt es `touchstart`/`touchmove`/`touchend`/`touchcancel`-Handler
(`onCardTouchStart()`/`onCardTouchMove()`/`onCardTouchEnd()`/`onCardTouchCancel()`), die ein
Wischen nach oben über `swipeThresholdPx` (70px) wie einen Tap behandeln und `chooseCard()`
aufrufen. Reiner UI-Zustand über zwei lokale Signale (`draggingIndex`/`dragDeltaY`, kein
Store-State) — `handCardStyle(index)` mischt diesen Drag-Offset als `--drag-y`-Custom-Property
in den bestehenden Fächer-Basisstil aus `handCardStyles()` (siehe dort), die eigentliche
`transform`-Berechnung inkl. `--drag-y` steht in `player-hand.component.scss`. Wird der
Schwellwert beim Loslassen nicht erreicht, snappt die Karte rein visuell (CSS-Transition, kein
Dispatch) zurück in ihre Fächer-Position. `event.preventDefault()` in `onCardTouchMove()`/
`onCardTouchEnd()` verhindert sowohl Seiten-Scroll/Pull-to-Refresh während des Ziehens als auch
den synthetischen `click`, den mobile Browser nach `touchend` sonst zusätzlich auslösen würden
(Doppel-Ausspielen der Karte) — bei einem reinen Tap ohne nennenswerte Bewegung feuert
`touchmove` gar nicht, dort bleibt der normale `click`-Pfad unverändert. `touch-action: pan-x`
auf dem Bild überlässt vertikales Wischen komplett dieser JS-Logik (keine Konkurrenz mit
nativem Scroll), horizontales Scrollen der Fächer-Reihe (`.currentHandStack`) bleibt möglich.
