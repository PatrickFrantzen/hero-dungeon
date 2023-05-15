export class User {
    public userId:string = '';
    public userEmail:string = '';
    public userNickname:string = '';
    public choosenHero:Object = {};
    public handstack: string[] = [];
    public deliveryStack: string[] = [];

    constructor(obj? : { userId: string, userEmail: string, userNickname: string, choosenHero: Object, handstack: string[], deliveryStack: string[]}) {
        this.userId = obj?.userId || '';
        this.userEmail = obj?.userEmail || '';
        this.userNickname = obj?.userNickname || '';
        this.choosenHero = obj?.choosenHero || {};
        this.handstack = obj?.handstack || [];
        this.deliveryStack = obj?.deliveryStack || [];
    }

    public toJSON() {
        return {
            userId: this.userId,
            userEmail: this.userEmail,
            userNickname: this.userNickname,
            choosenHero: this.choosenHero,
            handstack: this.handstack,
            deliveryStack: this.deliveryStack,
        }  
    }
}