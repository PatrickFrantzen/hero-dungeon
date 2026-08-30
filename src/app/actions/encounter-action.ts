import { Mob } from "src/models/monster/monster.class"

export class UpdateMonsterTokenArray{
    static readonly type ="[Player Hand page] Updating the token Array of a Monster"
    constructor(public currentEnemyToken: string[]) {}
}

export class SetNewEnemy{
    static readonly type ="[Player Hand page] creating a new Enemy"
    constructor(public newEnemy: Mob) {}
}

/** Boss-Kampagne (Anleitung S. 6): Boss #1 -> #2 -> ... -> #5, nach jedem besiegten Boss
 * kommt der nächste. */
export class SetCurrentBoss {
    static readonly type = "[Card play service] setting the current boss for the campaign"
    constructor(public currentBoss: Mob) {}
}

export class SetRemainingBosses {
    static readonly type = "[Card play service] setting the remaining bosses in the campaign"
    constructor(public remainingBosses: Mob[]) {}
}
