import { Hero, shuffle } from "./hero.class";

export class Walküre extends Hero {
    public override heroName: string = 'Walküre';
    public override cardstack: string[] = [];
    public override heroPower: string = 'Verleiht Flügel';
    public override description: string = 'Lege 3 Karten auf den Ablagestapel und dafür zieht jeder andere Mitspieler 2 Karten.';

    constructor() {
        super();
        const heroCards = new Map([
            ['red', 6],
            ['yellow', 9],
            ['green', 6],
            ['blue', 8],
            ['purple', 3],
            ['yellow_yellow', 2],
            ['heiligeHandgranate', 1],
            ['göttlicherSchild', 2],
            ['heiltrank', 2],
            ['heile', 1],
            ['haudrauf_monster', 1]
        ])
        heroCards.forEach((value, key) => {
            for (let i = 0; i < value; i++) {
                this.cardstack.push(key);
                
            }
        })
        shuffle(this.cardstack)
    }
}

