import { Game, GameStatus } from "src/models/game"

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

export class UpdateGameStatus {
    static readonly type = "[Game page] updating game status"
    constructor(public gameStatus: GameStatus){}
}

export class StartGameTimer {
    static readonly type = "[Game page] starting dungeon timer"
    constructor(public timerStartedAt: number){}
}

/** Setzt Pause-Felder direkt und bedingungslos (statt eines guard-basierten Toggles), weil sie
 * sowohl vom auslösenden Client (Magier/Göttlicher Schild) als auch von PlayerHandComponents
 * Firestore-Sync für alle anderen Clients verwendet werden - letztere muss den zuletzt in
 * Firestore gespeicherten Stand übernehmen können, unabhängig vom lokalen Vorzustand. */
export class SetGameTimerPauseState {
    static readonly type = "[Game page] setting dungeon timer pause state"
    constructor(public timerPausedAt: number | null, public timerPausedSecondsTotal: number){}
}