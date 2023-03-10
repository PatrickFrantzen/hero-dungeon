export class Hero {
    public heroName: string = '';
    public heroStack: string[] = [];
    public heroPower: string = '';

    constructor() {}

    public toJSON() {
        return {
            heroName: this.heroName,
            heroStack: this.heroStack,
            heroPower: this.heroPower,
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