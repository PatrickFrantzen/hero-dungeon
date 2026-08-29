import { Mob } from "src/models/monster/monster.class"

export class UpdateMonsterTokenArray{
    static readonly type ="[Player Hand page] Updating the token Array of a Monster"
    constructor(public currentEnemyToken: string[]) {}
}

export class SetNewEnemy{
    static readonly type ="[Player Hand page] creating a new Enemy"
    constructor(public newEnemy: Mob) {}
}
