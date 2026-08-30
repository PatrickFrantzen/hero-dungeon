import { shuffle } from '../shuffle.util';
import { EXTRA_DECK_FOR_HERO, HERO_DEFINITIONS, HeroDefinition, HeroId } from './hero-definitions';

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

/**
 * `useExtraDeck`: 2-Spieler-Sonderregel (Anleitung S. 3) bzw. Singleplayer-Erweiterung - mischt
 * `EXTRA_DECK_FOR_HERO[id]`s Kartendeck mit ein, damit der Nachziehstapel nicht zu früh leer
 * wird (80 statt 40 Karten).
 */
export function createHero(id: HeroId, useExtraDeck = false): Hero {
    const definition = HERO_DEFINITIONS.find((def) => def.id === id);
    if (!definition) {
        throw new Error(`Unbekannter Heldentyp: ${id}`);
    }

    const hero = new Hero();
    hero.heroName = definition.heroName;
    hero.heroPower = definition.heroPower;
    hero.description = definition.description;
    hero.cardstack = hero.buildCardstack(useExtraDeck ? mergeWithExtraDeck(definition) : definition.cardCounts);
    return hero;
}

function mergeWithExtraDeck(definition: HeroDefinition): Map<string, number> {
    const extraDefinition = HERO_DEFINITIONS.find((def) => def.id === EXTRA_DECK_FOR_HERO[definition.id])!;
    const merged = new Map(definition.cardCounts);
    extraDefinition.cardCounts.forEach((count, card) => {
        merged.set(card, (merged.get(card) ?? 0) + count);
    });
    return merged;
}