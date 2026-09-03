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

## Zentrierung: `display: contents` auf beiden Hosts (Live-Test-Fix, 2026-09-03)

`EnemyContainerComponent` und `EnemyComponent` haben beide `:host { display: contents; }`
gesetzt. Ohne das sind Custom-Element-Hosts standardmäßig `display: inline` (kein UA-Stylesheet
dafür) - `.current-Enemy`s `align-self: center` griff dadurch nicht, weil die Karte nicht mehr
direktes Flex-Item von `.mainfield` (`game.component.scss`) war, sondern zwei Ebenen tiefer in
zwei inline gerenderten Hosts steckte. Symptom: die Enemy-Karte klebte am linken Rand statt
zentriert zu sein. Ein neuer Wrapper um `<app-enemy>`/`<app-enemy-container>` (o.ä.) muss
denselben `display: contents`-Fix bekommen, sonst bricht die Zentrierung erneut.

## Dynamische Token-Icon-Größe: Schwelle statt durchgehender Interpolation (2026-09-03)

`tokenIconSizePx()` skaliert nicht mehr über den gesamten Bereich 1-12 Icons linear, sondern
bleibt bis `TOKEN_ICON_NO_SHRINK_COUNT` (6 Icons - normale Monster/Person/Hindernis-Encounter
laut `monster-collection.data.ts` haben meist 2-5 Kampf-Token + 1 Kategorie-Icon) konstant bei
`TOKEN_ICON_MAX_PX` (jetzt 76px statt vorher 64px) und interpoliert erst darüber linear bis
`TOKEN_ICON_MIN_PX` bei `TOKEN_ICON_MAX_COUNT` (12, nur bei Mini-Boss/Boss erreichbar). Live-
Test-Feedback: normale Encounter sollten deutlich größere Icons zeigen, nur Bosse mit vielen
Token brauchen die Verkleinerung. Der `clamp()`-Sicherheitsnetz-Oberwert in
`enemy.component.scss` wurde von 72px auf 76px angehoben, damit er den neuen `TOKEN_ICON_MAX_PX`
nicht kappt.

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
