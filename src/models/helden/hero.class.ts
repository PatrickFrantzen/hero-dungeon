import { shuffle } from '../shuffle.util';
import { HERO_DEFINITIONS, HeroId } from './hero-definitions';

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

    public buildCardstack(cardCounts: Map<string, number>): string[] {
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

export function createHero(id: HeroId): Hero {
    const definition = HERO_DEFINITIONS.find((def) => def.id === id);
    if (!definition) {
        throw new Error(`Unbekannter Heldentyp: ${id}`);
    }

    const hero = new Hero();
    hero.heroName = definition.heroName;
    hero.heroPower = definition.heroPower;
    hero.description = definition.description;
    hero.cardstack = hero.buildCardstack(definition.cardCounts);
    return hero;
}