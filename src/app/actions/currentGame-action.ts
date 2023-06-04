import { Game } from "src/models/game"
import { Mob } from "src/models/monster/monster.class"

export class CurrentGameAction {
    static readonly type = '[Startscreen page] Generating new Game ID'
    constructor(public id: string) {}
}

export class CurrentGameData {
    static readonly type = '[Startscreen page] Setting the Data of Game'
    constructor(public game: Game) {}
}

export class UpdateMonsterTokenArray{
    static readonly type ="[Player Hand page] Updating the token Array of a Monster"
    constructor(public currentEnemyToken: string[]) {}
}

export class SetNewEnemy{
    static readonly type ="[Player Hand page] creating a new Enemy"
    constructor(public newEnemy: Mob) {}
}

export class updateChoosenHeros{
    static readonly type = "[Game page] updating choosen Heros"
    constructor(public hero: {playerName:string, playerId: string, playerHero:string }) {}
}