export class updateChoosenHeros {
    static readonly type = "[Game page] updating choosen Heros"
    constructor(public hero: {playerName:string, playerId: string, playerHero:string }) {}
}

export class SetChoosenHeros {
    static readonly type = "[Player Hand page] setting the full choosen Heros list"
    constructor(public choosenHeros: {playerName:string, playerId: string, playerHero:string }[]) {}
}
