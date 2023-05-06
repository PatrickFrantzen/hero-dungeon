export class CurrentUserAction{
    static readonly type = '[Startscreen Page] Fetching current User Data'
    constructor(public id: string, public name: string) {}
}