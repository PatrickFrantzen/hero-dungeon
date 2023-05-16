import { Hero, shuffle } from "./hero.class";

export class Zauberin extends Hero {
    public override heroName: string = 'Zauberin';
    public override heroStack: string[] = [];
    public override heroPower: string = 'hindernis';

    constructor() {
        super();
        const heroCards = new Map([
            ['red', 3],
            ['yellow', 5],
            ['green', 7],
            ['blue', 9],
            ['purple', 6],
            ['blue_blue', 2],
            ['verhinderung', 1],
            ['feuerball', 4],
            ['magischeBombe', 3]
        ])
        heroCards.forEach((value, key) => {
            for (let i = 0; i < value; i++) {
                this.heroStack.push(key);
                
            }
        })
        shuffle(this.heroStack)
    }
}

