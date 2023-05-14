import { Boss, Mob, MonsterStack } from "./monster/monster.class";

export interface Game {
    numberOfPlayers: number ;
    choosenHeros: string[];
    currentEnemy: Mob;
    currentBoss: Boss;
    isLost:boolean;
    gameId: string;
    difficulty: string;
    monsterStack: MonsterStack[];
    allBosses: Boss[];

    // constructor(obj?: { numberOfPlayers: number; choosenHeros: []; currentEnemy: object[], currentBoss: {}, isLost: boolean, gameId: string, difficulty: string, monsterStack: object[], allBosses: object[] }) {
    //     this.numberOfPlayers = obj?.numberOfPlayers || 0;
    //     this.choosenHeros = obj?.choosenHeros || [];
    //     this.currentEnemy = obj?.currentEnemy || [];
    //     this.currentBoss = obj?.currentBoss || {};
    //     this.isLost = obj?.isLost || false;
    //     this.gameId = obj?.gameId || '';
    //     this.difficulty = obj?.difficulty || '';
    //     this.monsterStack = obj?.monsterStack || [];
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
    //         monsterStack: this.monsterStack,
    //         allBosses: this.allBosses,
    //     }
        
    // }

}