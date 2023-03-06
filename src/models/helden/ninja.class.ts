import { Hero, shuffle } from "./hero.class";

export class Ninja extends Hero {
    public override heroName: string = 'Ninja';
    public override heroStack: string[] = [];
    public heroPower: string = 'Supersprung';

    constructor() {
        super();
        const heroCards = new Map([
            ['red', 7],
            ['yellow', 5],
            ['green', 3],
            ['blue', 6],
            ['purple', 7],
            ['purple/purple', 3],
            ['Sprint', 3],
            ['Rücklings', 3],
            ['Stehlen', 2],
            ['Spende', 1]
        ])
        heroCards.forEach((value, key) => {
            for (let i = 0; i < value; i++) {
                this.heroStack.push(key);
                
            }
        })
        shuffle(this.heroStack)
    }
}

