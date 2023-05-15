import { Mob } from "./monster/monster.class";

export interface Game {
    numberOfPlayers: number ;
    choosenHeros: string[];
    currentEnemy: Mob;
    currentBoss: Mob;
    isLost:boolean;
    gameId: string;
    difficulty: string;
    Mob: Mob[];
    allBosses: Mob[];

    // constructor(obj?: { numberOfPlayers: number; choosenHeros: []; currentEnemy: object[], currentBoss: {}, isLost: boolean, gameId: string, difficulty: string, Mob: object[], allBosses: object[] }) {
    //     this.numberOfPlayers = obj?.numberOfPlayers || 0;
    //     this.choosenHeros = obj?.choosenHeros || [];
    //     this.currentEnemy = obj?.currentEnemy || [];
    //     this.currentBoss = obj?.currentBoss || {};
    //     this.isLost = obj?.isLost || false;
    //     this.gameId = obj?.gameId || '';
    //     this.difficulty = obj?.difficulty || '';
    //     this.Mob = obj?.Mob || [];
    //     this.allBosses = obj?.allBosses || [];
    // }

    // public toJSON() {
    //     return {
    //         numberOfPlayers: this.numberOfPlayers,
    //         choosenHeros: this.choosenHeros,
    //         currentEnemy: this.currentEnemy,
    //         currentBoss: this.currentBoss,
    //         isLost: this.isLost,
    //         gameId: this.gameId,
    //         difficulty: this.difficulty,
    //         Mob: this.Mob,
    //         allBosses: this.allBosses,
    //     }
        
    // }

}