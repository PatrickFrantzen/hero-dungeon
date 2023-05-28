import { Hero, shuffle } from "./hero.class";

export class Zauberin extends Hero {
    public override heroName: string = 'Zauberin';
    public override cardstack: string[] = [];
    public override heroPower: string = 'hindernis';
    public override description: string = 'Lege 3 Karten auf den Ablagestapel und besiege dadurch ein Hindernis';


    constructor() {
        super();
        const heroCards = new Map([
            ['red', 3],
            ['yellow', 5],
            ['green', 7],
            ['blue', 9],
            ['purple', 6],
            ['blue_blue', 2],
            ['verhinderung_event', 1],
            ['feuerball_monster', 4],
            ['magischeBombe', 3]
        ])
        heroCards.forEach((value, key) => {
            for (let i = 0; i < value; i++) {
                this.cardstack.push(key);
                
            }
        })
        shuffle(this.cardstack)
    }
}

