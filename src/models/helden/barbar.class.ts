import { Hero, shuffle } from "./hero.class";

export class Barbar extends Hero {
    public override heroName: string = 'Barbar';
    public override heroStack: string[] = [];
    public override heroPower: string = 'Schlagkräftige Argumente';

    constructor() {
        super();
        const heroCards = new Map([
            ['red', 5],
            ['yellow', 7],
            ['green', 5],
            ['blue', 3],
            ['purple', 6],
            ['red_purple', 2],
            ['red_blue', 2],
            ['red_green', 2],
            ['red_red', 2],
            ['red_yellow', 2],
            ['wut', 2],
            ['riesensprung_hindernis', 2]
        ])
        heroCards.forEach((value, key) => {
            for (let i = 0; i < value; i++) {
                this.heroStack.push(key);
                
            }
        })
        shuffle(this.heroStack)
    }
}

