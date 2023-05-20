import { Hero, shuffle } from "./hero.class";

export class Ninja extends Hero {
    public override heroName: string = 'Ninja';
    public override cardstack: string[] = [];
    public override heroPower: string = 'Supersprung';
    public override description: string = 'Lege 3 Karten auf den Ablagestapel und besiege dadurch ein Hindernis.';


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

