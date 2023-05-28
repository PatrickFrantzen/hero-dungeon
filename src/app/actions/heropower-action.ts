export class UpdateHeropowerActivated {
    static readonly type ='[heropower page, cardsinHand page] update the heropower status'
    constructor(public heropower: boolean){}
}