export class Monster {
    public monsterStack: Array<object> = [];

    constructor(difficulty: string, numberOfPlayer: number) {

        if (difficulty == 'easy' && numberOfPlayer == 2) { // Switch case funktion einbauen um i zu bestimmen, dann i als Parameter
            //an die Funktion mit der For-SChleife weitergeben
            for (let i = 0; i < 10; i++) {

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
        {
            "name": "Eingestürzte Decke",
            "tokens": ['red', 'blue', 'blue'],
            "type": "Hindernis"
        },
        {
            "name": "Bodenloser Abgrund",
            "tokens": ['purple', 'purple'],
            "type": "Hindernis"
        },
        {
            "name": "Ein Ad-Hoc-Völkerballturnier",
            "tokens": ['purple', 'purple', 'green'],
            "type": "Hindernis"
        },
        {
            "name": "Der Karpaltunnel",
            "tokens": ['blue', 'green', 'green'],
            "type": "Hindernis"
        },
        {
            "name": "Zombies ohne Ende",
            "tokens": ['red', 'red', 'red'],
            "type": "Monster"
        },
        {
            "name": "Steve",
            "tokens": ['blue', 'purple', 'green'],
            "type": "Person"
        },
        {
            "name": "Knappe Nedward",
            "tokens": ['yellow', 'yellow','green'],
            "type": "Person"
        },
        {
            "name": "Eine Kriegerprinzessin",
            "tokens": ['yellow', 'green'],
            "type": "Person"
        },
        {
            "name": "Hai mit sexy Beinen!!",
            "tokens": ['red', 'green', 'green'],
            "type": "Monster"
        },
        {
            "name": "Eine 'Abkürzung'",
            "tokens": ['red', 'yellow', 'yellow'],
            "type": "Hindernis"
        },
        {
            "name": "Knuffiger Goblin",
            "tokens": ['red', 'purple'],
            "type": "Monster"
        },
        {
            "name": "Ein überteuerter Händler",
            "tokens": ['blue', 'blue', 'purple'],
            "type": "Person"
        },
        {
            "name": "Zombietusse",
            "tokens": ['red', 'green'],
            "type": "Monster"
        },
        {
            "name": "Ein Kaktus, der umarmen will",
            "tokens": ['yellow', 'yellow', 'yellow'],
            "type": "Monster"
        },
        {
            "name": "Ein aufrechter Geist",
            "tokens": ['blue', 'yellow'],
            "type": "Monster"
        },
        {
            "name": "Buchstäblich ein Strohmann",
            "tokens": ['red', 'blue', 'purple'],
            "type": "Hindernis"
        },
        {
            "name": "Ein Armhändler",
            "tokens": ['blue', 'green'],
            "type": "Person"
        },
        {
            "name": "Eine sicher sprengfallenfreie Truhe",
            "tokens": ['purple', 'yellow', 'yellow'],
            "type": "Hindernis"
        },
        {
            "name": "Ein Haufen schreiender Kinder",
            "tokens": ['red', 'yellow', 'green'],
            "type": "Person"
        },
        {
            "name": "Ein langsam ladender Bildschirm",
            "tokens": ['red', 'purple', 'green'],
            "type": "Hindernis"
        },
        {
            "name": "Lebendiges Grünzeug",
            "tokens": ['blue', 'blue', 'blue'],
            "type": "Hindernis"
        },
        {
            "name": "Sir Fuzzy",
            "tokens": ['purple', 'green', 'green'],
            "type": "Monster"
        },
        {
            "name": "Ein 'Geist', ja klar!",
            "tokens": ['red', 'red', 'green'],
            "type": "Person"
        },
        {
            "name": "Ein Timberwolf",
            "tokens": ['red', 'red'],
            "type": "Monster"
        },
        {
            "name": "Reizender Schleim",
            "tokens": ['purple', 'green'],
            "type": "Monster"
        },
        {
            "name": "Grozznak der Große",
            "tokens": ['purple', 'yellow', 'green'],
            "type": "Person"
        },
        {
            "name": "Eine lächerlich hohe Eiswand",
            "tokens": ['purple', 'purple', 'purple'],
            "type": "Hindernis"
        },
        {
            "name": "Gespickte Wand",
            "tokens": ['blue', 'blue', 'yellow'],
            "type": "Hindernis"
        },
        {
            "name": "Nur ein paar Stufen",
            "tokens": ['blue', 'purple'],
            "type": "Hindernis"
        },
        {
            "name": "Barb-Irrer",
            "tokens": ['red', 'red', 'yellow'],
            "type": "Person"
        },
        {
            "name": "ÖÖÖÖHHAA",
            "tokens": ['yellow', 'blue', 'yellow'],
            "type": "Monster"
        },
        {
            "name": "Typ mit massiven Schulterpanzern",
            "tokens": ['red', 'blue', 'red'],
            "type": "Person"
        },
        {
            "name": "7 Null-Bock-Zwerge",
            "tokens": ['red', 'blue', 'yellow'],
            "type": "Person"
        },
        {
            "name": "2 Mann, 1 Bogen",
            "tokens": ['green', 'yellow', 'green'],
            "type": "Person"
        }
    ]

    public toJSON() {
        return {
            monsterStack: this.monsterStack
        }

    }
}