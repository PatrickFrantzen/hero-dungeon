export class StartTutorial {
  static readonly type = '[Tutorial] start tutorial';
}

export class NextTutorialStep {
  static readonly type = '[Tutorial] go to next step';
}

export class PreviousTutorialStep {
  static readonly type = '[Tutorial] go to previous step';
}

export class SkipTutorial {
  static readonly type = '[Tutorial] skip tutorial';
}

export class CompleteTutorial {
  static readonly type = '[Tutorial] complete tutorial';
}
