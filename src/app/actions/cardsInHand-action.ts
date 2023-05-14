import { CardStack } from "src/models/helden/card.class"

export class CardToAblagestapelAction {
    static readonly type = '[PlayerHand page] Played Card goes to Ablagestapel'
    constructor(public token: string) {}
}

export class CurrentCardsInHand {
    static readonly type = '[PlayerHand page] get current Cards in Hand'
    constructor(public cardsInHand: string[]) {}
}

export class UpdateCurrentHandAction {
    static readonly type = '[PlayerHand page] Updating Cards in Hand'
    constructor(public cardsInHand: string[]) {}
}