export class Game {
    public numberOfPlayers: number = 0;
    public choosenHeros: string[] = [];
    public currentEnemy: string = '';
    public isLost:boolean = false;
    public gameId: string = ''

    constructor(obj?: { numberOfPlayers: number; choosenHeros: string[]; currentEnemy: string, isLost: boolean, gameId: string }) {
        this.numberOfPlayers = obj?.numberOfPlayers || 0;
        this.choosenHeros = obj?.choosenHeros || [];
        this.currentEnemy = obj?.currentEnemy || '';
        this.isLost = obj?.isLost || false;
        this.gameId = obj?.gameId || '';
    }

    public toJSON() {
        return {
            numberOfPlayers: this.numberOfPlayers,
            choosenHeros: this.choosenHeros,
            currentEnemy: this.currentEnemy,
            isLost: this.isLost,
            gameId: this.gameId
        }
        
    }

}