export interface TutorialStep {
  title: string;
  body: string;
  /** CSS-Selector eines echten UI-Elements, das per Spotlight hervorgehoben wird - fehlt er,
   * dimmt das Overlay den ganzen Screen ohne Ausschnitt (siehe TutorialOverlayComponent). */
  targetSelector?: string;
}

// Echte Inhalte fuer Station 1+2 (Startscreen, Heldenauswahl) aus PR 2, docs/planned/
// tutorial-plan.md. Stationen 3-7 (Dungeon-Timer, Encounter, Handkarten, Heldenfaehigkeit,
// Sieg/Niederlage) folgen in PR 3-4 - bis dahin endet das Tutorial hier mit "Fertig".
// Die Heldenauswahl-Schritte haben bewusst keinen targetSelector: der Dialog
// (DialogChooseHeroComponent) ist zu diesem Zeitpunkt nicht geoeffnet, das Tutorial startet
// nur vom Startscreen aus (siehe PR-2-Beschreibung im Plan: targetSelector nur fuer
// startscreen.component.html).
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
    title: 'Und weiter?',
    body: 'Die nächsten Schritte - Dungeon-Timer, Encounter-Symbole, Handkarten spielen, ' +
      'Heldenfähigkeit und Sieg/Niederlage - kommen als Ergänzung in einer der nächsten Versionen ' +
      'dazu. "Fertig" schließt das Tutorial und merkt es als gesehen.'
  }
];
