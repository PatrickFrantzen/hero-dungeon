export class Game {
    public numberOfPlayers: number = 0;
    public choosenHeros: object[] = [];
    public currentEnemy: string = '';
    public isLost:boolean = false;
    public gameId: string = '';
    public difficulty: string = ';'

    constructor(obj?: { numberOfPlayers: number; choosenHeros: object[]; currentEnemy: string, isLost: boolean, gameId: string, difficulty: string }) {
        this.numberOfPlayers = obj?.numberOfPlayers || 0;
        this.choosenHeros = obj?.choosenHeros || [];
        this.currentEnemy = obj?.currentEnemy || '';
        this.isLost = obj?.isLost || false;
        this.gameId = obj?.gameId || '';
        this.difficulty = obj?.difficulty || '';
    }

    public toJSON() {
        return {
            numberOfPlayers: this.numberOfPlayers,
            choosenHeros: this.choosenHeros,
            currentEnemy: this.currentEnemy,
            isLost: this.isLost,
            gameId: this.gameId,
            difficulty: this.difficulty
        }
        
    }

}