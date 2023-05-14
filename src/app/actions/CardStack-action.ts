

export class CreateNewCardStackAction {
static readonly type = '[Game page] Creating new Cardstack'
constructor(public cardstack: string[]) {}
}

export class UpdateCardStackAction {
    static readonly type = '[PlayerHand page] Updating Cardstack'
    constructor(public cardstack: string[]) { }
}