# Plan: Mobile-Native-Feel statt nur "passt auf den Bildschirm"

## Status (2026-09-01)

Stufe A (TODO 1–6) umgesetzt, siehe PR #45 (TODO 1–4, 6) und
[Issue #46](https://github.com/PatrickFrantzen/hero-dungeon/issues/46) (TODO 5, PWA-Manifest —
war durch fehlende Icon-Assets blockiert, Blocker durch vom Nutzer bereitgestelltes Rund-Emblem
gelöst).

Alle noch offenen Punkte aus diesem Plan (TODO 8, sowie die Stufe-B-Ideenliste 2026-08-31) sind
als GitHub Issues angelegt — siehe Tabelle am Ende des jeweiligen Abschnitts unten bzw.
"Referenzen".

**TODO 7 (Handkarten als fixe Bottom-Leiste) umgesetzt**, inkl. Fächer-Layout für den Fall, dass
die Hand über 5 Karten wächst (Dieb "Stehlen": 3 Handkarten ablegen, 5 nachziehen —
`dieb.service.ts` deckelt die Handgröße dabei nicht, siehe Diagnosepunkt 9 unten war ursprünglich
nur mit ≤5 Karten gerechnet, das war zu optimistisch):

- `player-hand.component.scss` — `.card-area` ist jetzt `position: fixed` am unteren Rand
  (Daumenzone), `.currentHandStack` nicht mehr `flex-wrap: wrap` sondern `flex-wrap: nowrap` mit
  `overflow-x: auto`-Fallback. `.event-button`/`.card-stack` an die neue, flachere Leiste
  angepasst (Deko-Kartenstapel verkleinert, damit er in der schmaleren Leiste nicht dominiert).
- `player-hand.component.ts` — neues `handCardStyles`-`computed()`: bei ≤5 Karten unverändert
  (flache Reihe, kein Verhaltensunterschied zu vorher), darüber Hearthstone/Slay-the-Spire-
  Prinzip: Karten überlappen (negativer `margin-left` relativ zur Kartenbreite) statt in eine
  zweite Reihe umzubrechen, fächern sich per Rotation (`--rot`) + Hochversatz (`--y`) auf und
  schrumpfen ab 7 Karten leicht (`--scale`). Die eigentliche `transform`-Deklaration bleibt in
  der `.scss` (inkl. `:active`-Press-Feedback über dieselben CSS-Custom-Properties), damit
  Inline-Styles nicht mit dem `:active`-Zustand kollidieren.
- `game.component.scss` — `.mainfield` bekommt `padding-bottom`, damit Content (v.a. `.game-stats`
  im Status `'won'`, wo Hand + Statistik laut `game.component.html` gleichzeitig sichtbar sind)
  nicht hinter der jetzt fixen Leiste verschwindet.
- Verifiziert: `ng build` grün, `ng test --watch=false --browsers=ChromeHeadlessCI` 54/54 grün,
  plus eine aus der echten `handCardStyles()`-Formel nachgebaute statische Testseite
  (Playwright/Chromium, 375×700) zeigt bei 3/5/7/8/10 Karten keine Überlappung mit dem
  Viewport-Rand. Design-Vorschau/Mockup (Vorher/Nachher + Fächer-Demo mit Live-Tweak-Regler) vor
  der Umsetzung mit dem Nutzer abgestimmt.
- **Nicht durchgeführt**: der reale Multiplayer-Smoke-Test mit echtem Firebase-Backend (siehe
  `player-hand/CLAUDE.md`) — in dieser Sandbox-Umgebung ohne Netzwerkzugriff nicht möglich,
  insbesondere: Heropower-Icon-Antippbarkeit direkt über der neuen Leiste auf einem echten Gerät,
  Verhalten bei aktivem `.color-effect`-Rahmen kombiniert mit der Fächer-Rotation.
- TODO 8 (Querformat) weiterhin offen, jetzt als
  [Issue #47](https://github.com/PatrickFrantzen/hero-dungeon/issues/47) getrackt.

Ursprünglicher Diagnosepunkt 9 unten ging von einer ohnehin auf 5 gedeckelten Hand aus — das ist
ungenau: `card-play.service.ts` deckelt nur das *Nachziehen* auf 5, Dieb/Ninjas "Stehlen"
(`dieb.service.ts`, 3 Karten ablegen + bis zu 5 nachziehen) kann die Hand auf bis zu 7 Karten
wachsen lassen, ohne dass eine Obergrenze greift.

### Nachtrag (2026-09-01) — Live-Test auf echtem Gerät: Fächer-Bug + Ladezeit + kaputtes Kartenbild

Der Nutzer testete den GitHub-Pages-Build auf einem echten Android-Gerät und meldete drei
Befunde:

1. **Fächer-Layout riss bei 7-8 Handkarten seitlich auf.** Ursache: `margin-left` in
   `handCardStyles()` reservierte nur die UNROTIERTE Kartenbreite im Flex-Layout (CSS
   `transform` ändert die Layout-Box nicht), die tatsächlich sichtbare Bounding-Box einer
   rotierten Karte ist aber breiter (`W*cos(θ) + H*sin(θ)`) — bei der vorherigen Rotation von bis
   zu ±28° wuchs die äußerste Karte dadurch über ihre reservierte Breite hinaus und wurde vom
   Viewport-Rand abgeschnitten. Fix: Rotation auf max. ±17° gedeckelt (vorher ±28°), Überlappung
   (`overlapFraction`) und Schrumpfung (`shrink`) in `player-hand.component.ts` nachgezogen,
   seitliches Padding in `.currentHandStack` (`player-hand.component.scss`) leicht erhöht.
   Verifiziert mit einer aus der echten Formel nachgebauten statischen Testseite
   (Playwright/Chromium) bei 8 und 10 Karten auf 320px und 375px Viewportbreite — keine
   Überlappung mit dem Viewport-Rand mehr.
2. **Kartenbild "Heiltrank" war kaputt.** `hero-definitions.ts` referenziert überall
   `card === 'heiltrank'` (Kleinschreibung), die Bilddatei hieß aber `Heiltrank.png`
   (Großschreibung). Auf einem case-insensitiven Dateisystem (lokale Entwicklung) fiel das nicht
   auf, GitHub Pages läuft aber auf einem case-sensitiven Linux-Server — dort schlug der
   Bild-Request fehl. Fix: Datei zu `heiltrank.png` umbenannt (Code nicht angefasst, da die
   Kleinschreibung überall sonst konsistent verwendet wird). Keine weiteren Groß-/
   Kleinschreibungs-Mismatches gefunden (Kartennamen aus `hero-definitions.ts` und Monster-Token
   aus `monster-collection.data.ts` gegen alle Dateien in `src/assets/img/cards/` bzw.
   `monsterToken/` abgeglichen).
3. **Kartenbilder luden spürbar langsam** (Diagnosepunkt 11 unten, bisher zurückgestellt).
   Prüfung ergab: alle 33 Bilder in `src/assets/img/cards/` lagen als 16-bit-PNG mit
   durchschnittlich ~530 KB vor (Gesamtordner 18 MB) bei einer Darstellungsgröße von max. 150px
   Breite — deutlich überdimensioniert. Fix: alle Kartenbilder auf eine 256-Farben-Palette
   requantisiert (`PIL.Image.quantize(colors=256, method=Image.FASTOCTREE)`, `optimize=True`) —
   bei diesem flächigen Illustrationsstil ohne sichtbaren Qualitätsverlust (visuell geprüft,
   inkl. der texturreichsten Bilder `quest.png`/`monster.png`). Ergebnis: 18 MB → 2,24 MB
   (-87 %). Zusätzlich `loading="lazy"`/`decoding="async"` auf Kartenstapel-Icon und Gegner-
   Token-Bilder ergänzt, `decoding="async"` auf Handkarten-Bilder (nicht `loading="lazy"`, da
   permanent sichtbar in der fixen Bottom-Leiste — verzögertes Laden brächte hier keinen Vorteil,
   nur Risiko für einen sichtbaren Ladeversatz).

Verifiziert: `ng build` grün, `ng test --watch=false --browsers=ChromeHeadlessCI` 54/54 grün.
**Nicht durchgeführt**: erneuter Live-Test auf echtem Gerät (kein Testgerät in dieser Sandbox).

---

Ursprünglicher Plan-Text (2026-08-31, vor Umsetzung von TODO 7): `docs/done/responsive-design-plan.md` hat die App überhaupt erst responsive gemacht
(kein horizontales Scrollen, `clamp()` statt fixer Pixel). Dieser Plan geht einen Schritt weiter:
"passt auf den Bildschirm" ist nicht dasselbe wie "fühlt sich auf dem Handy wie ein Spiel an".
Ausgelöst durch Nutzeranfrage, Mobile-Best-Practices zu recherchieren und zu prüfen, was Hero
Dungeon spezifisch noch fehlt.

Recherche-Quellen (2026-08-31, WebSearch): Apple HIG / Material Design Touch-Target-Richtwerte
(44pt/48dp Mindestgröße, ≥16px Abstand zum Bildschirmrand), aktuelle Artikel zu Mobile-CSS-
Konsistenz 2026 (`touch-action: manipulation` gegen 300ms-Tap-Delay, Safe-Area-Handling,
`100dvh` statt `100vh`), sowie allgemeine Mobile-Game-UX-Guidance (Daumenzone/Thumb-Zone-
Platzierung von Aktionen, mobile UX als eigene Disziplin statt geschrumpftes Desktop-Layout).

## Diagnose

Codebase-Scan (`grep -rn "touch-action\|user-select\|webkit-tap-highlight\|overscroll-behavior\|
env(safe-area"`) ergab **null Treffer** — keines der folgenden Mobile-Grundmuster ist im Projekt
vorhanden:

1. **Kein Touch-Feedback, nur `:hover`.** `player-hand.component.scss:55`
   (`.hand-card img:hover { cursor: pointer }`), `heropower.component.scss:12` — reine
   `:hover`-Regeln sind auf Touch-Geräten wirkungslos (kein Hover-Zustand) oder lösen einen
   "Sticky Hover" nach dem Tap aus. Es gibt **keinen** `:active`-Zustand irgendwo im Projekt —
   eine Handkarte antippen fühlt sich tot an, kein visuelles/State-Feedback, dass der Tap
   angekommen ist. Für ein Kartenspiel (wo genau das haptische "Karte reagiert auf Berührung"
   das Kern-Gamefeel ist) besonders spürbar.
2. **300ms-Tap-Delay + Doppeltipp-Zoom nicht unterbunden.** Kein `touch-action: manipulation`
   auf klickbaren Elementen (Handkarten-`<img>`, Heropower-Icon, alle Buttons). Auf mobilen
   Browsern ohne dieses CSS wartet der Browser bis zu 300ms nach jedem Tap, ob ein Doppeltipp
   (Zoom-Geste) folgt, bevor `click` ausgelöst wird — spürbare Verzögerung beim Kartenspielen.
3. **Kein `-webkit-tap-highlight-color: transparent`.** Jeder Tap auf Handkarte/Button blitzt
   kurz grau/blau auf (Standard-Tap-Highlight von Chrome/Safari) — bei einem Spiel mit eigenem
   Kartendesign wirkt das wie ein UI-Glitch, nicht wie Absicht.
4. **Kein `user-select: none` auf Spielgrafik.** Ein Long-Press auf ein `<img>` (Handkarte,
   Gegner-Token, Kartenstapel-Deko) löst auf iOS/Android das native Kontextmenü aus ("Bild
   sichern", Textauswahl-Handles) — unterbricht den Spielfluss, fühlt sich nicht wie eine
   native App an.
5. **`100vh`/`100vw` statt `100dvh`/`100dvw`.** `game.component.scss:7` (`.mainfield { min-height:
   100vh }`) — `100vh` zählt auf mobilen Browsern die (potenziell eingeblendete) Adressleiste
   mit, wodurch der sichtbare Bereich beim Scrollen/Ein-/Ausblenden der Adressleiste springt.
   `dvh` (dynamic viewport height) folgt stattdessen der tatsächlich sichtbaren Höhe. Alle
   Browser, die dieses Projekt laut `angular.json`/Browserslist unterstützen muss (aktuelles
   Ziel: moderne Evergreen-Browser), unterstützen `dvh` inzwischen; `100vh` als Fallback davor
   lassen, `dvh` danach überschreiben (kein Fallback-Verlust bei alten Browsern).
6. **Kein `viewport-fit=cover` + Safe-Area-Insets.** `src/index.html:7` — Viewport-Meta hat kein
   `viewport-fit=cover`, nirgends wird `env(safe-area-inset-*)` verwendet. Auf Geräten mit Notch/
   Dynamic Island/Home-Indicator (praktisch jedes aktuelle iPhone) bedeutet das entweder: Inhalt
   bleibt in einem kleineren "sicheren" Bereich eingerahmt (schmalere Nutzfläche als nötig) oder,
   sobald `viewport-fit=cover` gesetzt wird ohne Insets nachzuziehen, dass Heropower-Icon/Rest-
   Button/Event-Button unter dem Home-Indicator landen und schwer antippbar werden.
7. **Keine PWA-Installierbarkeit.** Kein `manifest.webmanifest`, kein `<meta name="theme-color">`,
   kein Service Worker (`ng add @angular/pwa` nicht ausgeführt). Ein Kartenspiel, das in
   Spielrunden von 5 Minuten (siehe Dungeon-Timer) gespielt wird, profitiert stark von "Zum
   Home-Bildschirm hinzufügen" — startet dann ohne Browser-Chrome (Adressleiste/Tab-Leiste), was
   allein schon mehr nutzbare Bildschirmfläche bringt und sich nach App statt Webseite anfühlt.
8. **Kein Hochformat/Querformat-Konzept.** `.mainfield` ist `flex-direction: column` mit Timer →
   Enemy-Card → (Stats/Prompts) → Handkarten sequentiell gestapelt. Auf einem Phone im
   Querformat (kurze Höhe, ~375–430px bei vielen aktuellen Geräten) übersteigt dieser Stapel
   (Timer + Enemy-Card + 5 Handkarten + Heropower-Overlay) die Viewporthöhe deutlich — die App
   hat aktuell kein Verhalten dafür (weder ein kompakteres Querformat-Layout noch ein
   "Bitte drehen"-Hinweis), Ergebnis: vertikales Scrollen mitten im aktiven Spielzug, bei dem
   ggf. nicht alle Elemente gleichzeitig sichtbar sind.
9. **Handkarten sind Teil des normalen Dokumentflusses, nicht als feste "Hand-Leiste" verankert.**
   `player-hand.component.html:20` (`.currentHandStack`) fließt im normalen Layout unterhalb von
   Enemy-Card/Prompts. Mobile Kartenspiele (Hearthstone Mobile, Slay the Spire Mobile u.ä.)
   docken die Hand üblicherweise als fixe Leiste am unteren Rand an (Daumenzone: die untere
   Bildschirmhälfte ist auf dem Handy am leichtesten mit dem Daumen erreichbar, siehe Recherche
   oben) — bei Hero Dungeon kann bei viel Content oberhalb (z.B. `.game-stats` + `.game-prompt`
   gleichzeitig sichtbar) die Hand aus dem sichtbaren Bereich rutschen, obwohl sie das zentrale
   Interaktionselement jeder Runde ist.
10. **Kleine Schrift ohne Mindestgröße-Absicherung.** `game.component.scss:89`
    (`.game-timer__label`/`.game-timer__hint { font-size: 0.8rem }`),
    `enemy.component.scss:38` (`.enemy-description { font-size: clamp(0.85rem, 2.3vw, 1rem) }`)
    — `clamp()` verhindert zwar Überlauf, aber nicht Unterschreitung einer gut lesbaren
    Mindestgröße auf sehr schmalen Geräten; unkritisch, aber Feinschliff-Kandidat.
11. **Keine Bild-Performance-Hinweise für mobiles Datenvolumen.** `<img src="./assets/img/cards/
    {{card}}.png">` (`player-hand.component.html:23`) ohne `loading="lazy"`/`decoding="async"` —
    bei 5 Handkarten + 4 Kartenstapel-Deko-Bildern + Gegner-Token-Icons pro Bildschirm lädt jede
    Karte in voller Auflösung, unabhängig von der tatsächlich gerenderten `clamp()`-Größe auf
    einem schmalen Gerät (kein `srcset`/responsive Images). Niedrige Priorität, da Kartenbilder
    vermutlich schon klein sind — vor Umsetzung Dateigrößen in `src/assets/img/cards/` prüfen.

## Entscheidung: zwei Umsetzungsstufen

**Stufe A — globale Mobile-Härtung (risikoarm, keine visuelle Redesign-Entscheidung nötig):**
Touch-Feedback, Tap-Delay/Highlight, `user-select`, `dvh`, Safe-Area-Grundgerüst, PWA-Manifest.
Ändert keine Layout-Struktur, nur Verhalten/Ränder — direkt umsetzbar.

**Stufe B — strukturelle Layout-Entscheidungen (visuelle Redesign-Fragen, vor Umsetzung mit
Nutzer abstimmen):** fixe Hand-Leiste am unteren Rand, Querformat-Kompaktlayout oder "Bitte
drehen"-Hinweis. Das sind Geschmacks-/Spielgefühl-Entscheidungen mit sichtbarem Effekt auf jeden
Screenshot der App — hier lohnt ein kurzer Abgleich (Mockup/Beschreibung) statt einer
einseitigen Umsetzung, auch wenn der Auftrag "frei im Design" erlaubt.

## TODOs — Stufe A

- [x] **TODO 1 — Globale Touch-Härtung in `src/styles.scss`**
  - `html { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }` — killt
    300ms-Delay und Standard-Tap-Highlight projektweit.
  - `body { overscroll-behavior-y: contain; }` — verhindert, dass ein vertikaler Swipe am
    oberen Bildschirmrand (z.B. beim Wegwischen des Heropower-Overlays) die Pull-to-Refresh-
    Geste des mobilen Browsers auslöst.
  - Verifikation: `ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI`.

- [x] **TODO 2 — `user-select: none` auf Spielgrafik, nicht auf Text**
  - Neue Utility-Klasse (oder direkt auf `img`-Selektoren in `player-hand.component.scss`,
    `enemy.component.scss`, `heropower.component.scss`) `-webkit-user-select: none; user-select:
    none; -webkit-touch-callout: none;` für Handkarten-, Kartenstapel-, Gegner-Token-Bilder —
    verhindert Long-Press-Kontextmenü. **Nicht** auf Formulareingaben/Fließtext anwenden
    (Signin/Signup-Inputs, Enemy-Beschreibungstext sollen selektierbar bleiben).
  - Verifikation: `ng build`, `ng test`.

- [x] **TODO 3 — Sichtbares `:active`-Feedback für Handkarten/Buttons**
  - `.hand-card img:active { transform: scale(0.96); }` (analog für Heropower-Icon,
    `game-prompt__button`, `rest-button`/`event-button`) mit kurzer `transition` — gibt beim
    Antippen sofortiges visuelles Feedback statt der wirkungslosen `:hover`-Regel.
  - Bestehende `:hover`-Regeln nicht entfernen (Desktop-Maus-Nutzer profitieren weiterhin davon),
    nur `:active` ergänzen.
  - Verifikation: `ng build`, `ng test`, visueller Check im Chrome-DevTools-Touch-Emulationsmodus.

- [x] **TODO 4 — `100dvh` statt `100vh`, Safe-Area-Grundgerüst**
  - `game.component.scss:7`: `min-height: 100vh;` beibehalten (Fallback), direkt danach
    `min-height: 100dvh;` ergänzen.
  - `src/index.html:7`: `viewport`-Meta um `viewport-fit=cover` ergänzen
    (`width=device-width, initial-scale=1, viewport-fit=cover`).
  - `.mainfield` (`game.component.scss`) Padding um `env(safe-area-inset-*)` ergänzen (`padding:
    max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right)) max(8px,
    env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));`), damit Timer/Handkarten
    nicht unter Notch/Dynamic Island/Home-Indicator rutschen, sobald der Content dank
    `viewport-fit=cover` bis an den Bildschirmrand reicht.
  - Analog für `startscreen`/`signin`/`signup`-Wrapper prüfen (kurzer Blick, ob dort ebenfalls
    `100vh` verwendet wird).
  - Verifikation: `ng build`, `ng test`, visueller Check mit Chrome-DevTools-Geräte-Presets, die
    eine Notch simulieren (z.B. "iPhone 15 Pro").

- [x] **TODO 5 — PWA-Grundgerüst (Manifest + Theme-Color, ohne Offline-Anspruch)** — umgesetzt in
  [Issue #46](https://github.com/PatrickFrantzen/hero-dungeon/issues/46). Icon-Blocker gelöst:
  vom Nutzer bereitgestelltes Rund-Emblem (Helm + gekreuzte Waffen, Runenring) freigestellt und
  als `src/assets/img/pwa/icon-192.png`/`icon-512.png` exportiert (Badge auf ~74% Durchmesser
  zentriert vor `#1a1a2e`-Fläche, damit der Runenring innerhalb der Android-"maskable"-
  Sicherheitszone bleibt, `purpose: "any maskable"`). `src/manifest.webmanifest` neu angelegt
  (`name`/`short_name: "Hero Dungeon"`, `display: "standalone"`, `background_color`/
  `theme_color: "#1a1a2e"`, `start_url: "startscreen"`), verlinkt über
  `<link rel="manifest" href="manifest.webmanifest">` in `src/index.html`. Kein
  `ng add @angular/pwa` (kein Service-Worker/Offline-Caching, siehe Begründung unten bei
  "Nicht im Scope"). Manifest-Pfade sind bewusst relativ (kein führendes `/`) statt absolut,
  damit sie wie das Hintergrundbild-Fix aus PR #53 unter dem GitHub-Pages-Unterpfad
  (`--base-href /hero-dungeon/`) korrekt auflösen — `src/manifest.webmanifest` zusätzlich in
  `angular.json` → `assets` eingetragen, sonst landet die Datei nicht im Build-Output.
  - Verifikation: `ng build` (Standard und mit `--base-href /hero-dungeon/`) grün,
    `ng test --watch=false --browsers=ChromeHeadlessCI` (54/54), Chrome-DevTools-Protokoll
    `Page.getAppManifest` liefert `"errors": []` sowohl lokal als auch unter simuliertem
    GitHub-Pages-Unterpfad.

- [x] **TODO 6 — Globale Verifikation Stufe A**
  - `ng build`, `ng test --watch=false --browsers=ChromeHeadlessCI`.
  - Visueller Check Chrome-DevTools Touch-Emulation + Geräte-Presets mit Notch, mind. einmal
    Startscreen + laufendes Spiel.

## TODOs — Stufe B (Design-Entscheidung, vor Umsetzung mit Nutzer abstimmen)

- [x] **TODO 7 — Handkarten als fixe Bottom-Leiste statt Dokumentfluss**
  - Vorschlag: `.currentHandStack` (`player-hand.component.scss`) auf `position: fixed; bottom:
    0; left: 0; right: 0;` mit eigenem Hintergrund (leicht abgedunkelt/`backdrop-filter: blur()`,
    passend zum bestehenden `.color-effect`-Look aus `heropower/`) — Daumenzone, immer sichtbar,
    unabhängig davon, wie viel Content (Stats/Prompts) darüber gerendert wird. `.mainfield`
    bräuchte dafür `padding-bottom`, das der tatsächlichen (jetzt variablen) Hand-Höhe entspricht,
    damit Enemy-Card nicht dahinter verschwindet — ähnliche Problematik wie beim
    Heropower-Overlay-Fix in `docs/done/responsive-design-plan.md` (Nachtrag 2026-08-29), also
    mit demselben Vorsicht-Level angehen (echtes Gerät testen, nicht nur DevTools).
  - Betrifft auch `.heropower-position` (koppelt an `.card-area`, s.o.) — müsste relativ zur
    neuen fixen Leiste neu verankert werden.
  - Auswirkung: sichtbarer Redesign-Schritt, kein reiner CSS-Fix — vor Umsetzung kurz Skizze/
    Beschreibung mit Nutzer abstimmen.

- [ ] **TODO 8 — Querformat: Kompaktlayout oder "Bitte drehen"-Hinweis** — getrackt in
  [Issue #47](https://github.com/PatrickFrantzen/hero-dungeon/issues/47)
  - Zwei Optionen zur Wahl (Nutzerentscheidung):
    a) `@media (max-height: 500px) and (orientation: landscape)`-Kompaktvariante: Timer/Enemy-
       Card nebeneinander statt gestapelt (`flex-direction: row` in `.mainfield` in diesem
       Breakpoint), Handkarten kleiner/enger.
    b) Einfacher Overlay-Hinweis "Bitte Gerät drehen" bei sehr niedriger Viewporthöhe im
       Querformat, Spiel bleibt im Hochformat-Layout optimiert (üblich bei Karten-/Brettspiel-
       Apps, die explizit auf Hochformat ausgelegt sind).
  - Verifikation: `ng build`, `ng test`, DevTools-Querformat-Emulation bei mind. 2–3
    gängigen Phone-Auflösungen.

## Stufe B — Ideenliste (2026-08-31, im Chat mit dem Nutzer entwickelt)

Über TODO 7/8 hinaus im Gespräch entstandene weitere Mobile-Ideen, jeweils als eigenes GitHub
Issue getrackt statt als weitere nummerierte Plan-TODOs — kleiner im Zuschnitt als TODO 7/8, aber
architektonisch/optisch trotzdem eigene Entscheidungen, kein reiner CSS-Fix:

| # | Idee | Issue |
|---|---|---|
| 1 | Handkarten als fixe Bottom-Leiste | TODO 7 oben, umgesetzt (PR #45) |
| 1b | Fächer-Layout bei >5 Handkarten (Hearthstone/Slay the Spire) | umgesetzt (PR #45) |
| 2 | Querformat: Kompaktlayout oder "Bitte drehen" | TODO 8 oben, [#47](https://github.com/PatrickFrantzen/hero-dungeon/issues/47) |
| 3 | Kartenstapel-Deko → Nachziehstapel-Icon mit Zähler-Badge | [#48](https://github.com/PatrickFrantzen/hero-dungeon/issues/48) |
| 4 | Heropower als andockbarer FAB statt permanentem Overlay | [#49](https://github.com/PatrickFrantzen/hero-dungeon/issues/49) |
| 5 | Enemy-Card kollabierbar (Beschreibung ein-/ausklappbar) | [#50](https://github.com/PatrickFrantzen/hero-dungeon/issues/50) |
| 6 | Haptisches Feedback (`navigator.vibrate`) | [#51](https://github.com/PatrickFrantzen/hero-dungeon/issues/51) |
| 7 | Swipe-Geste zum Karte-Spielen (Ergänzung zu Tap) | [#52](https://github.com/PatrickFrantzen/hero-dungeon/issues/52) |

## Nicht im Scope dieses Plans

- Kein Service-Worker/Offline-Caching (siehe TODO 5/Issue #46 — bewusst zurückgestellt, eigene
  Abwägung nötig wegen Firestore-Realtime-Daten).
- Keine Bild-Optimierung (`srcset`/`loading="lazy"`) in diesem Plan (Diagnosepunkt 11) — erst
  nach Prüfung der tatsächlichen Dateigrößen in `src/assets/img/` als eigener, kleiner Plan.
- Keine Vereinheitlichung kleiner Schriftgrößen (Diagnosepunkt 10) — Feinschliff, kein
  strukturelles Problem, bei Gelegenheit mitnehmen statt eigener TODO-Nummer.

## Referenzen

- `docs/done/responsive-design-plan.md` — Vorstufe (verhindert horizontales Scrollen/Clipping),
  dieser Plan baut darauf auf.
- `src/app/components/player-hand/CLAUDE.md`, `heropower/CLAUDE.md`, `game/CLAUDE.md` — vor
  Umsetzung von TODO 7 (Hand-Leiste) lesen, da direkt betroffen.
- Recherche 2026-08-31 (WebSearch): Apple HIG/Material-Touch-Target-Richtwerte, Mobile-CSS-
  Konsistenz-Artikel 2026 (`touch-action`, Safe-Area, `dvh`), Mobile-UX-Grundsätze (Daumenzone,
  mobile UX als eigene Disziplin).
- **GitHub Issues** (alle offenen Punkte dieses Plans, 2026-08-31 angelegt):
  [#46](https://github.com/PatrickFrantzen/hero-dungeon/issues/46) PWA-Manifest (TODO 5),
  [#47](https://github.com/PatrickFrantzen/hero-dungeon/issues/47) Querformat (TODO 8),
  [#48](https://github.com/PatrickFrantzen/hero-dungeon/issues/48) Kartenstapel-Zähler,
  [#49](https://github.com/PatrickFrantzen/hero-dungeon/issues/49) Heropower-FAB,
  [#50](https://github.com/PatrickFrantzen/hero-dungeon/issues/50) Enemy-Card kollabierbar,
  [#51](https://github.com/PatrickFrantzen/hero-dungeon/issues/51) Haptisches Feedback,
  [#52](https://github.com/PatrickFrantzen/hero-dungeon/issues/52) Swipe-Geste. Bei Umsetzung
  eines dieser Punkte zuerst das jeweilige Issue lesen (kann seit Anlage aktualisiert worden
  sein) statt nur diesen Plan-Abschnitt.
