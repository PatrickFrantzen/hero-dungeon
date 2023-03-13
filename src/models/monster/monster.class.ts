export class Monster {
    public monsterStack: Array<object> = [];

    constructor(difficulty: string) {

        if (difficulty == 'easy') {
            for (let i = 0; i < 3; i++) {

                const test = this.monsterCollection[Math.floor(Math.random() * this.monsterCollection.length)]
                console.log('monsterTest', test)
                this.monsterStack.push(test);
            }
            console.log('monsterCollection', this.monsterStack)
        }

    }


    monsterCollection: Array<object> = [
        {
            "name": "Treibsand",
            "tokens": ['purple', 'purple', 'yellow'],
            "type": "Hindernis"
        },
        {
            "name": "Unsichtbare Wand",
            "tokens": ['blue', 'blue'],
            "type": "Hindernis"
        },
        {
            "name": "Ein etwas unbequemer Stuhl",
            "tokens": ['red', 'purple', 'yellow'],
            "type": "Hindernis"
        },
        {
            "name": "Ein Rosetta-Stein-Golem",
            "tokens": ['purple', 'yellow'],
            "type": "Monster"
        },
        {
            "name": "Genau 26 Ninjas",
            "tokens": ['blue', 'purple', 'purple'],
            "type": "Person"
        },
        {
            "name": "William Duck I.",
            "tokens": ['blue', 'purple', 'yellow'],
            "type": "Monster"
        },
    ]

    public toJSON() {
        return {
            monsterStack: this.monsterStack
        }

    }
}