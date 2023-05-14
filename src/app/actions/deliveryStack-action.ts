export class CurrentDeliveryStack {
    static readonly type = '[PlayerHand page] get all Cards on deliverystack'
    constructor(public deliveryStackCards: string[]) {}
}

export class UpdateDeliveryStack {
    static readonly type ='[PlayerHand page] update the deliverystack'
    constructor(public deliveryStackCards: string[]){}
}