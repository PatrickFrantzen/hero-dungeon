import { Hero, shuffle } from "./hero.class";

export class Walküre extends Hero {
    public override heroName: string = 'Walküre';
    public override heroStack: string[] = [];
    public override heroPower: string = 'Verleiht Flügel';

    constructor() {
        super();
        const heroCards = new Map([
            ['red', 6],
            ['yellow', 9],
            ['green', 6],
            ['blue', 8],
            ['purple', 3],
            ['yellow/yellow', 2],
            ['Heilige Handgranate', 1],
            ['Göttlicher Schild', 2],
            ['Heiltrank', 2],
            ['Heile', 1],
            ['Hau drauf', 1]
        ])
        heroCards.forEach((value, key) => {
            for (let i = 0; i < value; i++) {
                this.heroStack.push(key);
                
            }
        })
        shuffle(this.heroStack)
    }
}

