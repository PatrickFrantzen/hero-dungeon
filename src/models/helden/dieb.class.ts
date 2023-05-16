import { Hero, shuffle } from "./hero.class";

export class Dieb extends Hero {
    public override heroName: string = 'Dieb';
    public override heroStack: string[] = [];
    public override heroPower: string = 'Langfinger';

    constructor() {
        super();
        const heroCards = new Map([
            ['red', 7],
            ['yellow', 5],
            ['green', 3],
            ['blue', 6],
            ['purple', 7],
            ['purple_purple', 3],
            ['sprint', 3],
            ['rücklings', 3],
            ['stehlen', 2],
            ['spende', 1]
        ])
        heroCards.forEach((value, key) => {
            for (let i = 0; i < value; i++) {
                this.heroStack.push(key);
                
            }
        })
        shuffle(this.heroStack)
    }
}

