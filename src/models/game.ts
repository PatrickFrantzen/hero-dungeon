export class Game {
    public numberOfPlayers: number = 0;
    public choosenHeros: object[] = [];
    public currentEnemy: object|undefined = [];
    public currentBoss: {} = [];
    public isLost:boolean = false;
    public gameId: string = '';
    public difficulty: string = '';
    public monsterStack: object[] = [];
    public allBosses: object[] = [];

    constructor(obj?: { numberOfPlayers: number; choosenHeros: object[]; currentEnemy: object[], currentBoss: {}, isLost: boolean, gameId: string, difficulty: string, monsterStack: object[], allBosses: object[] }) {
        this.numberOfPlayers = obj?.numberOfPlayers || 0;
        this.choosenHeros = obj?.choosenHeros || [];
        this.currentEnemy = obj?.currentEnemy || [];
        this.currentBoss = obj?.currentBoss || {};
        this.isLost = obj?.isLost || false;
        this.gameId = obj?.gameId || '';
        this.difficulty = obj?.difficulty || '';
        this.monsterStack = obj?.monsterStack || [];
        this.allBosses = obj?.allBosses || [];
    }

    public toJSON() {
        return {
            numberOfPlayers: this.numberOfPlayers,
            choosenHeros: this.choosenHeros,
            currentEnemy: this.currentEnemy,
            currentBoss: this.currentBoss,
            isLost: this.isLost,
            gameId: this.gameId,
            difficulty: this.difficulty,
            monsterStack: this.monsterStack,
            allBosses: this.allBosses,
        }
        
    }

}