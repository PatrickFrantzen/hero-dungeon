# player-hand/ — Hotspot, vor Änderungen lesen

`PlayerHandComponent` war der zentrale Hotspot im Projekt (mischte Firestore-Zugriff, NGXS-
Dispatch, Spielregeln und UI in einer ~586-Zeilen-Klasse). Seit
`docs/planned/player-hand-decomposition-plan.md` (TODO 1–3 umgesetzt, siehe Status-Abschnitt
oben in diesem Plan) ist die Komponente auf ~195 Zeilen reduziert:

- Firestore-Sync ausgelagert in `FirestoreSyncService` (`services/CLAUDE.md`).
- Heldenfähigkeiten-Prüfung ausgelagert in `HeropowerService`.
- Karten-/Encounter-Regeln ausgelagert in `CardPlayService` (`chooseCard()` als einziger
  öffentlicher Einstiegspunkt).

**Vor jeder größeren Änderung hier zuerst `docs/planned/player-hand-decomposition-plan.md`
lesen** — dort steht der aktuelle Umsetzungsstand (welche TODOs offen sind, u.a. optionale
Sub-Komponenten fürs Template und ein Heropower-Strategy-Pattern) und die Begründung für
bewusst nicht vereinheitlichte Stellen (siehe `HeropowerService`-Hinweis in
`services/CLAUDE.md`).

Diese Komponente ist der zentrale Ort, an dem Store-Dispatches, Firestore-Reads und
Spielregeln zusammenlaufen — bei jeder Änderung hier ist ein manueller Multiplayer-Smoke-Test
(Karte spielen, jede Heropower-Variante auslösen, zweiter Spieler tritt bei, Kartenstapel geht
zur Neige) sinnvoll, auch wenn `ng build`/`ng test` grün sind.
