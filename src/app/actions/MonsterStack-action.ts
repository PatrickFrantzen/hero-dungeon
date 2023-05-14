import { MonsterStack } from "src/models/monster/monster.class";

export class CreateNewMonsterStackAction {
    static readonly type='[Game Page] Creating new MonsterStack'
    constructor(public monsterStack:MonsterStack[]) {}
}

export class UpdateMonsterStackAction {
    static readonly type='[Player Hand page], Updating the MonsterStack'
    constructor(public monsterStack: MonsterStack[]) {}
}