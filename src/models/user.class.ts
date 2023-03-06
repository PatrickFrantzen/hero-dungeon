export class User {
    public userId:string = '';
    public userEmail:string = '';
    public userNickname:string = '';

    constructor(obj? : { userId: string, userEmail: string, userNickname: string}) {
        this.userId = obj?.userId || '';
        this.userEmail = obj?.userEmail || '';
        this.userNickname = obj?.userNickname || ''
    }

    public toJSON() {
        return {
            userId: this.userId,
            userEmail: this.userEmail,
            userNickname: this.userNickname
        }  
    }
}