import { shuffle } from '../shuffle.util';

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

    protected buildCardstack(cardCounts: Map<string, number>): string[] {
        const stack: string[] = [];
        cardCounts.forEach((count, cardName) => {
            for (let i = 0; i < count; i++) {
                stack.push(cardName);
            }
        });
        return shuffle(stack);
    }

    public toJSON() {
        return {
            heroName: this.heroName,
            cardstack: this.cardstack,
            heroPower: this.heroPower,
            description: this.description
        }

    }
}