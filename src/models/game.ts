import { Mob } from "./monster/monster.class";

export type GameStatus = 'playing' | 'won' | 'lost';

export interface Game {
    numberOfPlayers: number ;
    choosenHeros: {
        playerName: string,
        playerId: string,
        playerHero: string
    }[],
    currentEnemy: Mob;
    currentBoss: Mob;
    isLost:boolean;
    gameStatus: GameStatus;
    gameId: string;
    difficulty: string;
    Mob: Mob[];
    allBosses: Mob[];
    questCardActivated: boolean;
}