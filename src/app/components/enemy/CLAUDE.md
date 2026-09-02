# enemy/ — Container/Presenter-Paar

- **`enemy-container/enemy-container.component.ts`** — liest Store (`gameId`, `currentEnemy`
  aus `EncounterSelectors`, `questCardStatus`) und schreibt per `effect()` den Quest-Card-Status
  zurück (Store-Dispatch + `GameRepositoryService.updateQuestStatus()`). Kein eigenes Markup
  außer dem Weiterreichen an `<app-enemy>`.
- **`enemy.component.ts`** (+ `.html`/`.scss`) — reine Darstellung, bekommt alles über
  `input()` (`gameId`, `currentEnemy`, `questCardStatus`), kein Store-/Firestore-Zugriff.

Neues Feature, das Gegner-Zustand anzeigt: an `EnemyComponent`s Inputs andocken statt einen
zweiten Store-Zugriffspunkt zu schaffen. Neue Ableitung/Seiteneffekt aus dem Gegner-Zustand
gehört in den Container (`computed()`/`effect()`), nicht in die Presenter-Komponente.

## Kategorie-Icon (Person/Hindernis/Monster)

`EnemyComponent.typeIcon` (`computed()`) mappt `currentEnemy().type` über das lokale
`typeIconByType`-Record (`'Person' → 'person'`, `'Hindernis' → 'hindernis'`,
`'Monster' → 'monster'`) auf einen Dateinamen unter `assets/img/monsterToken/`. Boss/Mini-Boss
und die freitextigen Ereigniskarten-Beschreibungen (siehe `Mob.type` in
`monster-collection.data.ts`) haben keinen Eintrag — `typeIcon()` liefert dann `undefined`, das
`@if (typeIcon(); as icon)` im Template rendert dann nichts. Das Icon wird im `@for` über
`currentEnemy().token` als zusätzliches, letztes `<img>` in `.enemy-tokens` angehängt (gleiches
Styling wie die Kampf-Token-Icons, kein eigener CSS-Block nötig). Die drei Bilder sind wie die
Kartenbilder auf 256 Farben quantisiert und auf 160×160px zugeschnitten.

## Dynamische Token-Icon-Größe (Live-Test-Feedback, 2026-09-02)

`EnemyComponent.tokenIconCount` (Kampf-Token + ggf. Kategorie-Icon) und `tokenIconSizePx`
(lineare Interpolation zwischen `TOKEN_ICON_MAX_PX` (64px, wenige Icons) und `TOKEN_ICON_MIN_PX`
(30px, `TOKEN_ICON_MAX_COUNT` = 12 Icons) sorgen dafür, dass Encounter mit wenigen Tokens
(normale Monster/Personen/Hindernisse, meist 2-5 Icons inkl. Kategorie-Icon) deutlich größer
dargestellt werden als früher (vorher fix `clamp(28px, 6vw, 44px)`), während die tokenreichsten
Bosse (`monster-collection.data.ts`, aktuell max. 12 Token bei "Verdammt, ein Drache!!!"/"Der
Dungeon-Overlord") nicht überlaufen. `TOKEN_ICON_MAX_COUNT` ist bewusst an der höchsten
tatsächlich vorkommenden Boss-Tokenzahl verankert, kein Schätzwert — bekommt ein künftiger Boss
mehr Token, muss diese Konstante mitgezogen werden. Folgt demselben Muster wie
`player-hand.component.scss` (`--rot`/`--y`/`--scale`): JS berechnet den fertigen Pixel-Wert,
`[ngStyle]` bindet ihn als `--token-size`-Custom-Property auf `.enemy-tokens`, `enemy.component.
scss` wendet ihn nur noch per `clamp()` an (Sicherheitsnetz gegen extreme Viewport-Breiten,
eigener, engerer Clamp für die Querformat-Kompaktansicht).

## Wappen/Schild-Rahmen (Restyling, Abstimmung mit Patrick, 2026-09-02)

`.current-Enemy` hat einen metallischen Rahmen (Gradient-Border-Trick: `padding-box`/
`border-box`-Layering, kein Bild-Asset) + dunklen Pergament-Hintergrund + dezenten violetten
Glow bekommen, passend zur Bildsprache der neuen Person/Hindernis/Monster-Icons (geprägte Münze
auf Holz, siehe Kategorie-Icon-Abschnitt oben). `--mdc-elevated-card-container-color:
transparent` neutralisiert zuerst Materials eigenen `mat-card`-Hintergrund-Token, bevor die
beiden `background`-Layer ihn ersetzen — ohne das könnte je nach Spezifität die MDC-Theme-Farbe
durchscheinen. `.enemy-name` nutzt `var(--font-heading)` (Cinzel, siehe
`src/app/components/CLAUDE.md`) statt Roboto. Bei einer künftigen Anpassung dieses Looks bitte
`--mdc-elevated-card-container-color` nicht vergessen, falls die neue Variante wieder einen
undurchsichtigen Hintergrund braucht.

## Joker-Token-Auswahl (Live-Test-Feedback, 2026-09-02)

Jägerin/Waldläufer "Joker" fragt jetzt aktiv, welches Token der aktuellen Bedrohung besiegt
werden soll, statt es deterministisch zu bestimmen (`CardPlayService.resolveJoker()`, siehe
`services/CLAUDE.md`) — wichtig für den Multiplayer, wo sich die Tokens durch die Karten anderer
Spieler jederzeit ändern können, eine Dialog-Auswahl mit fest eingefrorenem Tokenstand wäre dort
leicht veraltet oder würde bereits besiegte Tokens anzeigen.

- `EnemyComponent.tokenSelectable` (`input()`) lässt bei `true` alle Kampf-Token (nicht das
  Kategorie-Icon) über `.enemy-token--selectable` gelb pulsierend leuchten (dieselbe Akzentfarbe
  wie `.heropower-fab--active`) und klickbar werden; ein Klick emittiert `tokenChosen` mit dem
  Tokennamen und stoppt die Event-Propagation, damit nicht zusätzlich `toggleDescription()`
  auf der umschließenden `mat-card` feuert.
- `EnemyContainerComponent` liest `JokerSelectionSelectors.isActive`, kombiniert es aber
  zusätzlich mit `!currentEnemy().token.includes('event')` (Joker wirkt nicht gegen
  Ereigniskarten, Anleitung S. 8) — ohne diesen Zusatz-Guard könnte ein Encounter-Wechsel
  während einer noch laufenden Auswahl (bewusst nicht automatisch abgebrochen, siehe
  `joker-selection-state.ts`) das einzelne `event`-Token selbst leuchten lassen.
  `onTokenChosen()` dispatcht `ChooseJokerToken(token)` — die eigentliche Auflösung (inkl.
  `CardPlayService.resolveJoker()`-Aufruf) passiert in `PlayerHandComponent`, das die Hand-/
  Kartenstapel-Signale hält (`joker-selection-state.ts` ist bewusst das Kommunikationsmedium
  zwischen diesen beiden Geschwister-Komponenten unter `GameComponent`, kein Angular-Input/
  Output über `GameComponent` als Vermittler).
- Aktivierung/Abbruch (Toggle auf der Handkarte selbst) steht in
  `src/app/components/player-hand/CLAUDE.md`.
