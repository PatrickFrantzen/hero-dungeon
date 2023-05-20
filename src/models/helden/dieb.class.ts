import { Hero, shuffle } from "./hero.class";

export class Dieb extends Hero {
    public override heroName: string = 'Dieb';
    public override cardstack: string[] = [];
    public override heroPower: string = 'Langfinger';
    public override description: string = 'Lege 3 Karten auf den Ablagestapel und ziehe dafür 5 Karten.';


    constructor() {
        super();
        const heroCards = new Map([
            ['red', 7],
            ['yellow', 5],
            ['green', 3],
            ['blue', 6],
            ['purple', 7],
            ['purple_purple', 3],
            ['sprint_hindernis', 3],
            ['rücklings_person', 3],
            ['stehlen', 2],
            ['spende', 1]
        ])
        heroCards.forEach((value, key) => {
            for (let i = 0; i < value; i++) {
                this.cardstack.push(key);
                
            }
        })
        shuffle(this.cardstack)
    }
}

