/** Jägerin/Waldläufer "Joker": statt der Karte fest ein Token zu entnehmen (bisherige
 * Vereinfachung, siehe card-play.service.ts resolveJoker()), fragt das Spiel jetzt aktiv, gegen
 * welches Token der aktuellen Bedrohung der Joker eingesetzt wird - siehe joker-selection-state.ts. */
export class ActivateJokerSelection {
  static readonly type = '[player-hand page] activate joker token selection';
}

export class DeactivateJokerSelection {
  static readonly type = '[player-hand page] deactivate joker token selection';
}

export class ChooseJokerToken {
  static readonly type = '[enemy page] choose joker token';
  constructor(public token: string) {}
}

export class ClearJokerToken {
  static readonly type = '[player-hand page] clear joker token after resolving';
}
