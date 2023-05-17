import { Hero, shuffle } from "./hero.class";

export class Magier extends Hero {
    public override heroName: string = 'Magier';
    public override heroStack: string[] = [];
    public override heroPower: string = 'Zeit einfrieren';

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
            ['feuerball_monster', 4],
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

