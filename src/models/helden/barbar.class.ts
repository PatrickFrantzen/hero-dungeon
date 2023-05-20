import { Hero, shuffle } from "./hero.class";

export class Barbar extends Hero {
    public override heroName: string = 'Barbar';
    public override cardstack: string[] = [];
    public override heroPower: string = 'Schlagkräftige Argumente';
    public override description: string = 'Lege 3 Karten auf den Ablagestapel und besiege dadurch ein Monster';

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
                this.cardstack.push(key);
                
            }
        })
        shuffle(this.cardstack)
    }
}

