import { Hero, shuffle } from "./hero.class";

export class Jägerin extends Hero {
    public override heroName: string = 'Jägerin';
    public override heroStack: string[] = [];
    public override heroPower: string = 'Tierlieb';

    constructor() {
        super();
        const heroCards = new Map([
            ['red', 4],
            ['yellow', 3],
            ['green', 9],
            ['blue', 4],
            ['purple', 7],
            ['green_green', 2],
            ['joker', 8],
            ['heilkräuter', 2],
            ['treffer', 1]
        ])
        heroCards.forEach((value, key) => {
            for (let i = 0; i < value; i++) {
                this.heroStack.push(key);
                
            }
        })
        shuffle(this.heroStack)
    }
}

