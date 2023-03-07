export class User {
    public userId:string = '';
    public userEmail:string = '';
    public userNickname:string = '';
    public choosenHero:Object = {};

    constructor(obj? : { userId: string, userEmail: string, userNickname: string, choosenHero: Object}) {
        this.userId = obj?.userId || '';
        this.userEmail = obj?.userEmail || '';
        this.userNickname = obj?.userNickname || '';
        this.choosenHero = obj?.choosenHero || {};
    }

    public toJSON() {
        return {
            userId: this.userId,
            userEmail: this.userEmail,
            userNickname: this.userNickname,
            choosenHero: this.choosenHero,
        }  
    }
}