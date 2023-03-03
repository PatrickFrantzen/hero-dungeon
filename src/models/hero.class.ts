export class Hero {
    public heroName: string = '';
    public heroStack: string[] = [];

    constructor() {
        // for (let i = 0; i < 8; i++) {
        //     this.heroStack.push('red');
        //     this.heroStack.push('blue');
        //     this.heroStack.push('green');
        //     this.heroStack.push('yellow');
        //     this.heroStack.push('purple');
        // }
        // shuffle(this.heroStack)
    }

    public toJSON() {
        return {
            heroName: this.heroName,
            heroStack: this.heroStack
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