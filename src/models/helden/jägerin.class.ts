import { Hero } from "./hero.class";

export class Jägerin extends Hero {
    public override heroName: string = 'Jägerin';
    public override cardstack: string[] = [];
    public override heroPower: string = 'Tierlieb';
    public override description: string = 'Lege 3 Karten auf den Ablagestapel, dafür zieht einer von euch 4 Karten; das kannst auch du selbst sein.';


    constructor() {
        super();
        this.cardstack = this.buildCardstack(new Map([
            ['red', 4],
            ['yellow', 3],
            ['green', 9],
            ['blue', 4],
            ['purple', 7],
            ['green_green', 2],
            ['joker', 8],
            ['heilkräuter', 2],
            ['treffer_person', 1]
        ]));
    }
}

