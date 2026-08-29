import { Game } from "src/models/game"

export class CurrentGameAction {
    static readonly type = '[Startscreen page] Generating new Game ID'
    constructor(public id: string) {}
}

export class CurrentGameData {
    static readonly type = '[Startscreen page] Setting the Data of Game'
    constructor(public game: Game) {}
}

export class updateQuestCardActivated {
    static readonly type = "[Game page, Monster Page] updating quest card activation"
    constructor(public questCardActivated: boolean){}
}