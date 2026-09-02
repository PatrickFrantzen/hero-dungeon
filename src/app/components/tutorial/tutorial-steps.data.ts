export interface TutorialStep {
  title: string;
  body: string;
  /** CSS-Selector eines echten UI-Elements, das per Spotlight hervorgehoben wird - fehlt er,
   * dimmt das Overlay den ganzen Screen ohne Ausschnitt (siehe TutorialOverlayComponent). */
  targetSelector?: string;
}

// Echte Inhalte fuer alle sieben Stationen aus docs/planned/tutorial-plan.md: Startscreen,
// Heldenauswahl (PR 2), Dungeon-Timer, Encounter, Handkarten (PR 3), Heldenfaehigkeit und
// Sieg/Niederlage/Boss-Bestaetigung (PR 4). Die Heldenauswahl- und Sieg/Niederlage-Schritte
// haben bewusst keinen targetSelector: `DialogChooseHeroComponent` ist zu diesem Zeitpunkt
// nicht geoeffnet (Tutorial startet nur vom Startscreen aus, siehe PR-2-Beschreibung im Plan)
// und `.game-prompt`/`.game-success` existieren nur in den seltenen `bossDefeated`/`won`/
// `lost`-Zustaenden (siehe game.component.html) - beide Faelle laufen ins selbe
// Volldimmung-ohne-Ausschnitt-Fallback (siehe TutorialOverlayComponent.spotlightRect). Die
// Timer-/Encounter-/Handkarten-/Heropower-Schritte targeten dagegen echte, bereits im Markup
// vorhandene Klassen aus `game.component.html`/`enemy.component.html`/
// `player-hand.component.html`/`heropower.component.html` (`.game-timer`/`.current-Enemy`/
// `.currentHandStack`/`.heropower-fab`) - Timer/Encounter/Handkarten existieren nur, waehrend
// `GameComponent` gemountet ist (laufendes Spiel), der Heropower-FAB zusaetzlich nur, solange
// `PlayerHandComponent` sichtbar ist (also nicht bei `bossDefeated`/`lost`, siehe
// `game.component.html`). Weil `.tutorial-overlay` selbst `pointer-events: none` ist (siehe
// tutorial-overlay.component.ts), kann ein Spieler waehrend dieser Schritte reell weiterspielen
// bzw. erst ein Singleplayer-Spiel starten, ohne das Overlay schliessen zu muessen - findet
// `document.querySelector()` das Element (noch) nicht, dimmt das Overlay stattdessen den ganzen
// Screen ohne Ausschnitt (siehe Fallback oben).
export const tutorialSteps: TutorialStep[] = [
  {
    title: 'Willkommen im Hero Dungeon',
    body: 'Ihr erkundet gemeinsam einen Dungeon und müsst jeden Encounter innerhalb eines ' +
      '5-Minuten-Countdowns bewältigen, bevor euch die Zeit ausgeht. Dieses Tutorial zeigt euch ' +
      'die wichtigsten Stationen - ihr könnt es jederzeit über den Hilfe-Button erneut öffnen.'
  },
  {
    title: 'Singleplayer starten',
    body: 'Im Singleplayer spielt ihr allein gegen die Uhr. Ihr könnt euch jederzeit "ausruhen", ' +
      'um Karten abzulegen und neue nachzuziehen, wenn eure Hand nicht mehr zum aktuellen ' +
      'Encounter passt - im Multiplayer gibt es diese Option nicht.',
    targetSelector: '#tutorial-target-singleplayer'
  },
  {
    title: 'Multiplayer: Spiel erstellen oder beitreten',
    body: 'Mit "Neues Multiplayer-Spiel" startet ihr einen Dungeon für eure Gruppe und teilt den ' +
      'erzeugten Spielnamen mit euren Mitspielern. Wer bereits einen Namen kennt, trägt ihn hier ' +
      'ein und tritt über "Join Game" dem laufenden Spiel bei.',
    targetSelector: '#tutorial-target-multiplayer'
  },
  {
    title: 'Heldenauswahl',
    body: 'Vor dem ersten Encounter wählt jeder Spieler einen Helden mit eigenem Kartenstapel ' +
      'und eigener Heldenfähigkeit. Spielt ihr allein, stehen euch nur Dieb und Waldläufer zur ' +
      'Verfügung - beide kommen ohne Unterstützung durch Mitspieler aus. Im Multiplayer stehen ' +
      'euch alle Helden offen; sprecht euch am besten ab, damit sich eure Fähigkeiten ergänzen.'
  },
  {
    title: 'Dungeon-Timer',
    body: 'Sobald die erste Karte wirksam gespielt wird, startet ein 5-Minuten-Countdown - läuft ' +
      'er ab, ist der Dungeon verloren. Manche Heldenfähigkeiten und die Karte "Göttlicher ' +
      'Schild" frieren die Zeit vorübergehend ein, bis wieder jemand eine Karte spielt.',
    targetSelector: '.game-timer'
  },
  {
    title: 'Encounter: Symbole zuordnen',
    body: 'Jeder Encounter zeigt Symbol-Token, die ihr passenden Handkarten mit demselben ' +
      'Symbol zuordnen müsst - erst wenn alle Token abgedeckt sind, ist der Encounter besiegt. ' +
      'Das letzte Icon zeigt außerdem, ob es sich um eine Person, ein Hindernis oder ein Monster ' +
      'handelt.',
    targetSelector: '.current-Enemy'
  },
  {
    title: 'Handkarten spielen',
    body: 'Tippt oder klickt auf eine Handkarte, um sie gegen ein passendes Encounter-Symbol ' +
      'einzusetzen. Nach dem Spielen zieht ihr automatisch bis zur maximalen Handgröße nach - im ' +
      'Singleplayer könnt ihr zusätzlich jederzeit "ausruhen", um die Hand komplett zu erneuern.',
    targetSelector: '.currentHandStack'
  },
  {
    title: 'Heldenfähigkeit',
    body: 'Über den Kreis-Button unten rechts öffnet ihr eure Heldenfähigkeit - jeder Held hat ' +
      'eine eigene, oft an eine Bedingung geknüpfte Sonderaktion (z.B. Karten spenden, stehlen ' +
      'oder heilen). Der Magier friert damit sogar den Dungeon-Timer ein, bis wieder jemand eine ' +
      'Karte spielt. Ein gelber Ring am Button zeigt euch, wenn eine Fähigkeit gerade aktiv ist.',
    targetSelector: '.heropower-fab'
  },
  {
    title: 'Sieg, Niederlage und der nächste Dungeon',
    body: 'Besiegt ihr einen Boss, entscheidet ihr per Bestätigung, ob es in den nächsten Dungeon ' +
      'weitergeht - der Timer startet dabei wieder bei 5 Minuten. Läuft die Zeit vorher ab, ist ' +
      'der Dungeon verloren und ihr könnt die Kampagne von vorn versuchen. Nach dem letzten Boss ' +
      'habt ihr den Dungeon-Overlord bezwungen und das Spiel gewonnen.'
  },
  {
    title: 'Und los geht’s!',
    body: 'Das war’s mit den Grundlagen - ihr könnt dieses Tutorial jederzeit über den Hilfe-' +
      'Button auf dem Startscreen erneut öffnen. "Fertig" schließt es und merkt es als gesehen.'
  }
];
