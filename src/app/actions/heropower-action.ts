export class UpdateHeropowerActivated {
    static readonly type ='[heropower page, cardsinHand page] update the heropower status'
    constructor(public heropower: boolean){}
}

export class UpdateHeropowerArray {
    static readonly type ='[heropower page, cardsinHand page] update the heropowerArray status'
    constructor(public heropowerArray: string[]){}
}