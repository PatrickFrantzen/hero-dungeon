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
            ['red/purple', 2],
            ['red/blue', 2],
            ['red/green', 2],
            ['red/red', 2],
            ['red/yellow', 2],
            ['Wut', 2],
            ['Riesensprung', 2]
        ])
        heroCards.forEach((value, key) => {
            for (let i = 0; i < value; i++) {
                this.heroStack.push(key);
                
            }
        })
        shuffle(this.heroStack)
        console.log('test',this.heroStack)
    }
}

