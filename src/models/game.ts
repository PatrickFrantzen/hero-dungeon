import { Mob } from "./monster/monster.class";

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
    gameId: string;
    difficulty: string;
    Mob: Mob[];
    allBosses: Mob[];

}