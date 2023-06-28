export interface Herointerface {
    choosenHero: string;
    heroPower: string;
    description: string;
}

export class Hero {
    public heroName: string = '';
    public cardstack: string[] = [];
    public heroPower: string = '';
    public description: string = ''

    constructor() {}

    public toJSON() {
        return {
            heroName: this.heroName,
            cardstack: this.cardstack,
            heroPower: this.heroPower,
            description: this.description
        }
        
    }
}

export function shuffle(array:string[]) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}