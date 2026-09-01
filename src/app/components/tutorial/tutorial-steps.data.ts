export interface TutorialStep {
  title: string;
  body: string;
  /** CSS-Selector eines echten UI-Elements, das per Spotlight hervorgehoben wird - fehlt er,
   * dimmt das Overlay den ganzen Screen ohne Ausschnitt (siehe TutorialOverlayComponent). */
  targetSelector?: string;
}

// Platzhalter-Schrittliste fuer PR 1 (Tutorial-Infrastruktur, docs/planned/tutorial-plan.md) -
// verifiziert Overlay/Spotlight/Navigation ohne echte Inhalte. Die sieben realen Stationen
// (Startscreen, Heldenauswahl, Dungeon-Timer, Encounter, Handkarten, Heropower,
// Sieg/Niederlage) kommen schrittweise in den PRs 2-4 dazu.
export const tutorialSteps: TutorialStep[] = [
  {
    title: 'Willkommen im Tutorial',
    body: 'Das ist ein Platzhalter-Schritt zur Verifikation des Overlays - echte Inhalte folgen.'
  },
  {
    title: 'Platzhalter-Schritt 2',
    body: 'Auch dieser Schritt hat noch keinen echten Inhalt.'
  },
  {
    title: 'Platzhalter-Schritt 3',
    body: 'Letzter Platzhalter-Schritt - "Fertig" schliesst das Tutorial und merkt es als gesehen.'
  }
];
