export class CurrentGameAction {
    static readonly type = '[Startscreen page] Generating new Game ID'
    constructor(public id: string) {}
}