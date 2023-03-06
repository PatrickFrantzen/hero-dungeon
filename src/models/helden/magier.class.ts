import { Hero, shuffle } from "./hero.class";

export class Magier extends Hero {
    public override heroName: string = 'Magier';
    public override heroStack: string[] = [];
    public heroPower: string = 'Zeit einfrieren';

    constructor() {
        super();
        const heroCards = new Map([
            ['red', 3],
            ['yellow', 5],
            ['green', 7],
            ['blue', 9],
            ['purple', 6],
            ['blue/blue', 2],
            ['Verhinderung', 1],
            ['Feuerball', 4],
            ['Magische Bombe', 3]
        ])
        heroCards.forEach((value, key) => {
            for (let i = 0; i < value; i++) {
                this.heroStack.push(key);
                
            }
        })
        shuffle(this.heroStack)
    }
}

