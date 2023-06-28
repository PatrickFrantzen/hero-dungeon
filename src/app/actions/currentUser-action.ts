export class CurrentUserAction {
  static readonly type = '[Startscreen Page] Fetching current User Data';
  constructor(public id: string, public name: string) {}
}

export class CurrentUserHeroAction {
  static readonly type = '[Startscreen Page] Fetchin current User Hero';
  constructor(
    public choosenHero: string,
    public heroPower: string,
    public description: string
  ) {}
}
