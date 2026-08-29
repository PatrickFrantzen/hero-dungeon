# Plan: App responsive gestalten

## Status (2026-08-29)

TODO 1–5 umgesetzt (Flexbox/`clamp()` statt absoluter Pixel-Positionierung in `player-hand/`,
`heropower/`, `enemy/`, `game/`, `startscreen/`, `signin/`, `signup/`). Verifiziert:
`ng build` grün, `ng test --watch=false --browsers=ChromeHeadlessCI` 45/45 grün (2x wiederholt).
Zusätzlich per Playwright/Chromium geprüft: kein horizontales Scrollen bei 375px/768px/1440px
auf dem Login-Screen (echter `ng serve`) sowie strukturell auf einer aus den echten CSS-Regeln
nachgebauten Test-Seite für Timer/Enemy-Card/5-Handkarten/Heropower-Overlay — bei 375px bricht
die Handkarten-Reihe dank `flex-wrap` sauber um (4+1), kein Clipping.

**Nicht durchgeführt**: der volle manuelle Multiplayer-Smoke-Test mit echtem Firebase-Backend
(Login, Karte spielen, Heropower auslösen) aus `player-hand/CLAUDE.md` — Firebase-Requests sind
in dieser Sandbox-Umgebung netzwerkseitig blockiert (`net::ERR_CONNECTION_RESET`), ein Login war
daher nicht möglich. Sollte vor dem Merge in einer Umgebung mit Firebase-Zugriff nachgeholt
werden, insbesondere: Heropower-Overlay darf Handkarten auf schmalen Screens nicht verdecken,
Kartenstapel-Deko unten links darf mit Handkarten nicht kollidieren.

Kontext: Die App hat aktuell keinerlei Responsive-Verhalten — kein einziges `@media` im ganzen
Projekt, Layout basiert auf `100vw`/`100vh` plus absoluter Pixel-Positionierung, die auf ein
festes Desktop-Viewport-Seitenverhältnis ausgelegt ist. Auf schmalen/mobilen Viewports laufen
Handkarten aus dem sichtbaren Bereich, Heropower-Overlay und Enemy-Card können sich überlappen.
Dieses Dokument ist der Umsetzungsplan, um das schrittweise zu beheben, im gleichen Stil wie
`docs/done/onpush-refactor-plan.md` (Diagnose → nummerierte TODOs → Verifikation).

## Diagnose

- **`src/index.html:7`** — `viewport`-Meta-Tag ist korrekt gesetzt, kein Handlungsbedarf hier.
- **`src/styles.scss`** — keine globalen Breakpoints, kein responsive Grundgerüst.
- **`src/app/components/player-hand/player-hand.component.scss`** (Hotspot, siehe eigene
  `CLAUDE.md`) — größter Blocker:
  - `.card-area { width: 100vw }`, Handkarten in `.hand-card` per `[ngStyle]="{'left.px': x * 170}"`
    (`player-hand.component.html:19`) absolut nebeneinander platziert — feste 170px-Schrittweite,
    unabhängig von Viewportbreite. Max. 5 Karten (`card-play.service.ts:203`,
    `5 - handsize.length`), d.h. bis zu `5 * 170px = 850px` Breite plus `right: 25%`-Offset von
    `.currentHandStack` — auf schmalen Screens (< ~900px) laufen die letzten Karten aus dem
    sichtbaren Bereich.
  - `.card-stack img { left: 50px; width: 150px }` — fester Kartenstapel links, gleiches Problem
    in kleinerem Maßstab.
- **`src/app/components/heropower/heropower.component.scss`** — `.heropower-position` ist mit
  `bottom: 300px; left/right: 25%` absolut über dem Spielfeld positioniert, an die feste
  Handkarten-Höhe gekoppelt. Bricht, sobald `player-hand` responsive wird, muss mitgezogen
  werden.
- **`src/app/components/enemy/enemy.component.scss`** — `.current-Enemy { height: 250px }`,
  unkritisch, aber sollte mit angefasst werden, damit `mat-card` nicht breiter als der Viewport
  wird.
- **`src/app/components/game/game.component.scss`** — `.mainfield` (`100vh`/`100vw`,
  `flex-direction: column`) ist als Grundgerüst tragfähig. `.game-timer { min-width: 220px }`
  skaliert auf sehr schmalen Screens (< 260px) schlecht, aber niedrige Priorität.
- **`src/app/components/startscreen/startscreen.component.scss`**,
  **`signin/signin.component.scss`**, **`signup/signup.component.scss`** — einfachere
  Formulare mit `.start-label-box { position: absolute; top: 50% }`, geringerer Aufwand, aber
  ebenfalls ohne jede Breakpoint-Anpassung.
- **Dialog-Komponenten** (`dialog-choose-hero`, `dialog-game-settings`, `dialog-heropower`) —
  0 px-Werte in den SCSS-Dateien, nutzen vermutlich Material-Defaults; kurz gegenprüfen, ob
  `MatDialog.open(...)`-Aufrufe feste `width`/`minWidth` setzen (aktuell keine Treffer gefunden),
  niedrige Priorität.
- **Material 21 (`@angular/cdk`)** ist bereits im Projekt (`@angular/cdk/layout` für
  `BreakpointObserver`), wird aber aktuell nirgends genutzt — kein zusätzliches Package nötig.

## Entscheidung: Ansatz

Kein CSS-only-Nachrüsten von `@media`-Queries über die bestehenden Pixelwerte, sondern
**Umstellung der betroffenen Layouts von absoluter Pixel-Positionierung auf Flexbox mit
relativen/`clamp()`-basierten Maßen**, weil die feste `x * 170px`-Logik strukturell nicht
skaliert (siehe Diagnose). `player-hand/` ist damit automatisch auch ein Fortschritt Richtung
`docs/planned/player-hand-decomposition-plan.md` (dort offene TODOs zu Sub-Komponenten fürs
Template), bleibt aber ausdrücklich außerhalb des Scopes dieses Plans — hier geht es nur um
Responsive-Verhalten, keine Struktur-Extraktion.

## TODOs

- [x] **TODO 1 — `player-hand/` von `[ngStyle] left.px` auf Flexbox umstellen**
  - `.currentHandStack` von `position: relative; right: 25%` auf `display: flex; flex-wrap: wrap;
    justify-content: center; gap: clamp(4px, 1.5vw, 16px)` umstellen, `.hand-card` von
    `position: absolute` auf normalen Flex-Flow.
  - `[ngStyle]="{'left.px': x * 170}"` in `player-hand.component.html:19` entfernen (Flexbox
    übernimmt die Anordnung).
  - Kartenbreite von fixem `width: 150px` auf `width: clamp(70px, 15vw, 150px)` (max. 5 Karten,
    15vw pro Karte verhindert Umbruch bei normaler Desktop-Breite, schrumpft aber auf Mobile).
  - `.card-stack` (Kartenstapel links unten) analog von `left: 50px` auf eine relative Position
    innerhalb des Flex-Containers oder `left: clamp(8px, 5vw, 50px)`.
  - Verifikation: `ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI`, visuell bei
    verschiedenen Breiten prüfen (Browser-Devtools-Responsive-Modus: ~375px, ~768px, ~1440px) —
    keine Karte darf abgeschnitten werden, keine Überlappung mit Heropower/Enemy.

- [x] **TODO 2 — `heropower/` an das neue `player-hand`-Layout koppeln**
  - `.heropower-position` von festem `bottom: 300px` auf einen Wert lösen, der sich aus der
    tatsächlichen (jetzt variablen) Handkarten-Höhe ergibt — entweder über CSS Grid/Flexbox im
    Eltern-Template (`player-hand.component.html`, wo `<app-heropower-container>` bereits als
    Kind von `.currentHandStack`-Sibling gerendert wird) statt absoluter Positionierung, oder
    `bottom: clamp(120px, 30vh, 300px)`, falls eine strukturelle Umstellung zu groß für diesen
    Plan ist.
  - `left/right: 25%` beibehalten oder auf `clamp()`/`%`-Kombination prüfen, je nachdem was nach
    TODO 1 visuell passt.
  - Verifikation: `ng build`, `ng test`, visuell — Heropower-Icon darf Handkarten nicht
    verdecken, muss auf 375px-Breite noch klickbar sein.

- [x] **TODO 3 — `enemy/` von fixer Höhe lösen**
  - `.current-Enemy { height: 250px }` auf `min-height`/`max-height` mit `clamp()` umstellen,
    damit `mat-card` bei vielen Token-Icons nicht überläuft und auf schmalen Screens nicht
    unnötig hoch bleibt.
  - Verifikation: `ng build`, `ng test`.

- [x] **TODO 4 — `game.component.scss` Feinschliff**
  - `.game-timer { min-width: 220px }` auf `min-width: min(220px, 90vw)` o.ä., damit der Timer
    auf sehr schmalen Screens (< 260px) nicht über den Rand hinausragt.
  - `.mainfield` zusätzlich von `height: 100vh; width: 100vw` auf `min-height: 100vh; width: 100%`
    umgestellt (analog `startscreen/`), damit eine sichtbare Scrollbar nicht durch `100vw`
    horizontales Scrollen erzeugt und der Inhalt bei viel gestapeltem Content vertikal scrollen
    kann statt abgeschnitten zu werden.
  - Verifikation: `ng build`, `ng test`.

- [x] **TODO 5 — `startscreen/`, `signin/`, `signup/` responsive nachziehen**
  - `.start-label-box { position: absolute; top: 50% }` (startscreen) und die analogen
    Formular-Container in `signin`/`signup` auf eine Lösung umstellen, die auch bei niedriger
    Viewporthöhe (Mobile im Querformat) nicht abgeschnitten wird — z.B. `position: relative` mit
    Flexbox-Zentrierung im `.mainfield`-Container statt `top: 50%` + fehlendem `transform:
    translateY(-50%)`.
  - Niedrigste Priorität dieses Plans — nach TODO 1–4, falls Zeit/Scope reicht.
  - Verifikation: `ng build`, `ng test`.

- [x] **TODO 6 — Globale Verifikation**
  - `ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI` (mehrfach wiederholt, wie in
    `docs/done/onpush-refactor-plan.md` üblich).
  - Manueller visueller Check in Browser-Devtools-Responsive-Modus bei mind. drei Breakpoints
    (~375px Mobile, ~768px Tablet, ~1440px Desktop) für: Startscreen, Sign-in/Sign-up, laufendes
    Spiel (Enemy-Card, Handkarten, Heropower-Overlay, Dungeon-Timer) — kein horizontales
    Scrollen, keine abgeschnittenen/überlappenden Elemente.
  - Kein automatisierter visueller Regressionstest im Projekt vorhanden — dieser manuelle Check
    ist der einzige Nachweis, entsprechend explizit im Abschlussbericht festhalten, ob er
    durchgeführt werden konnte.

## Nicht im Scope dieses Plans

- Keine strukturelle Extraktion aus `player-hand.component.ts`/`.html` in Sub-Komponenten (siehe
  `docs/planned/player-hand-decomposition-plan.md` für den aktuellen Stand dazu) — nur CSS/Template-
  Änderungen für Responsive-Verhalten.
- Kein Einsatz von `@angular/cdk/layout` `BreakpointObserver` für TS-seitige Breakpoint-Logik,
  solange reines CSS (`clamp()`, `flex-wrap`, `@media`) ausreicht — falls sich im Laufe der
  Umsetzung zeigt, dass eine Komponente unterschiedliches Markup je Breakpoint braucht (nicht
  nur andere Maße), das dann als Ergänzung zu diesem Plan nachtragen, nicht stillschweigend
  einführen.
- Keine Optimierung für Touch-Bedienung (z.B. größere Klickflächen für Handkarten auf Mobile)
  über das hinaus, was sich aus der reinen Größenanpassung ergibt.

## Referenzen

- `docs/done/onpush-refactor-plan.md` — Stilvorlage für diesen Plan.
- `docs/planned/player-hand-decomposition-plan.md` — verwandter, aber unabhängiger Umbau
  derselben Komponente.
- `src/app/components/player-hand/CLAUDE.md`, `src/app/components/heropower/CLAUDE.md`,
  `src/app/components/enemy/CLAUDE.md`, `src/app/components/game/CLAUDE.md` — vor Änderungen an
  den jeweiligen Verzeichnissen lesen.
