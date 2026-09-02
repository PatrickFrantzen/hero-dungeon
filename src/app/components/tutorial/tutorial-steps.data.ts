export interface TutorialStep {
  title: string;
  body: string;
  /** CSS-Selector eines echten UI-Elements, das per Spotlight hervorgehoben wird - fehlt er,
   * dimmt das Overlay den ganzen Screen ohne Ausschnitt (siehe TutorialOverlayComponent). */
  targetSelector?: string;
}

// Echte Inhalte fuer Station 1+2 (Startscreen, Heldenauswahl, PR 2) und Station 3-5
// (Dungeon-Timer, Encounter, Handkarten, PR 3) aus docs/planned/tutorial-plan.md. Station 6+7
// (Heldenfaehigkeit, Sieg/Niederlage) folgen in PR 4 - bis dahin endet das Tutorial hier mit
// "Fertig". Die Heldenauswahl-Schritte haben bewusst keinen targetSelector: der Dialog
// (DialogChooseHeroComponent) ist zu diesem Zeitpunkt nicht geoeffnet, das Tutorial startet
// nur vom Startscreen aus (siehe PR-2-Beschreibung im Plan: targetSelector nur fuer
// startscreen.component.html). Die Timer-/Encounter-/Handkarten-Schritte targeten dagegen
// echte, bereits im Markup vorhandene Klassen aus `game.component.html`/`enemy.component.html`/
// `player-hand.component.html` (`.game-timer`/`.current-Enemy`/`.currentHandStack`) - die
// existieren nur, waehrend `GameComponent` gemountet ist (laufendes Spiel). Weil
// `.tutorial-overlay` selbst `pointer-events: none` ist (siehe tutorial-overlay.component.ts),
// kann ein Spieler waehrend dieser Schritte reell weiterspielen bzw. erst ein Singleplayer-Spiel
// starten, ohne das Overlay schliessen zu muessen - findet `document.querySelector()` das
// Element (noch) nicht (z.B. Overlay auf dem Startscreen geoeffnet, bevor ein Spiel laeuft),
// dimmt das Overlay stattdessen den ganzen Screen ohne Ausschnitt (siehe Fallback oben).
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
    title: 'Und weiter?',
    body: 'Die nächsten Schritte - Heldenfähigkeit und Sieg/Niederlage - kommen als Ergänzung in ' +
      'einer der nächsten Versionen dazu. "Fertig" schließt das Tutorial und merkt es als gesehen.'
  }
];
