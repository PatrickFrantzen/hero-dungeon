import { Mob } from "src/models/monster/monster.class";

export class CreateNewMobAction {
    static readonly type='[Game Page] Creating new Mob'
    constructor(public mob:Mob[]) {}
}

export class UpdateMobAction {
    static readonly type='[Player Hand page], Updating the Mob'
    constructor(public mob: Mob[]) {}
}