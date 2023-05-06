export class UpdateCardStackAction {
    static readonly type = '[PlayerHand page] Updating Cardstack'
    constructor(public cardstack: string[]) {}
    }