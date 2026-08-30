import { Mob } from "./monster/monster.class";

/** `bossDefeated`: ein Boss ist besiegt, aber es gibt noch weitere Bosse in der Kampagne -
 * wartet auf die Bestätigung eines Spielers, ob es mit dem nächsten Dungeon weitergeht (siehe
 * CardPlayService.continueToNextDungeon()/GameComponent). */
export type GameStatus = 'playing' | 'bossDefeated' | 'won' | 'lost';

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
    timerStartedAt: number | null;
    timerDurationSeconds: number;
    timerPausedAt: number | null;
    timerPausedSecondsTotal: number;
}