export interface ChooseHeroDialogResult {
  choosenHero: {
    heroname: string;
    heropower: string;
    cardstack: string[];
    description: string;
  };
}

export interface GameSettingsDialogResult {
  numberOfPlayer: number;
  difficulty: string;
  gameId: string;
}

export interface HeropowerDialogPlayer {
  playerName: string;
  playerId: string;
  playerHero: string;
}
