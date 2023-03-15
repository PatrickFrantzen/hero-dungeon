export class Monster {
    public monsterStack: Array<object> = [];

    constructor(setting: string) {

        switch (setting) {
            case 'easy+2':
                this.loadMonster(10);
                this.loadQuests(4);
                this.shuffle(this.monsterStack);
                break;
            case 'easy+3':
                this.loadMonster(12);
                this.loadQuests(6);
                this.shuffle(this.monsterStack);
                break;
            case 'easy+4':
                this.loadMonster(14);
                this.loadQuests(8);
                this.shuffle(this.monsterStack);
                break;
                case 'easy+5':
                    this.loadMonster(16);
                    this.loadQuests(10);
                    this.shuffle(this.monsterStack);
                    break;
            default:
                break;
        }
    }



    loadMonster(numberOfMonsterCards: number) {
        for (let i = 0; i < numberOfMonsterCards; i++) {
            const monsterStack = this.monsterCollection[Math.floor(Math.random() * this.monsterCollection.length)]
            this.monsterStack.push(monsterStack);
        }
        console.log('monsterCollection', this.monsterStack)
    }

    loadQuests(numberOfQuestCards: number) {
        for (let i = 0; i < numberOfQuestCards; i++) {
            const questStack = this.questCollection[Math.floor(Math.random() * this.questCollection.length)]
            this.monsterStack.push(questStack);
        }
    }

    questCollection: Array<object> = [
        {
            "questname": "Feindselige Riesenkrabbe",
            "description": "Mini-Boss",
            "token": ['green', 'green', 'green', 'yellow', 'yellow', 'yellow']
        },
        {
            "questname": "Ein Bonsai-T-Rex",
            "description": "Mini-Boss",
            "token": ['yellow', 'yellow', 'green', 'green', 'red', 'red']
        },
        {
            "questname": "Der Sammler",
            "description": "Mini-Boss",
            "token": ['yellow', 'green', 'red', 'blue', 'purple']
        },
        {
            "questname": "Plötzliche Krankheit",
            "description": "Jeder legt alle Handkarten auf den eigenen Ablagestapel.",
            "token": ['']
        },
        {
            "questname": "Chaos",
            "description": "Jeder gibt seine Handkarten einem Mitspieler.",
            "token": ['']
        },
        {
            "questname": "Ein Wehweh",
            "description": "Jeder legt 1 Karte auf den eigenen Ablagestapel.",
            "token": ['']
        },
        {
            "questname": "Hinterhalt",
            "description": "Deckt 2 Karten aus dem Dungeon auf. Ihr müsst beide besiegen, bevor es weitergeht.",
            "token": ['']
        },
        {
            "questname": "Falltür",
            "description": "Jeder legt 3 Karten auf den eigenen Ablagestapel.",
            "token": ['']
        },
        {
            "questname": "Der Rattenkönig",
            "description": "Mini-Boss",
            "token": ['purple', 'purple', 'purple', 'red', 'red', 'red']
        },
        {
            "questname": "Ein Zauberer mit schlechtem Ruf",
            "description": "Mini-Boss",
            "token": ['blue', 'blue', 'blue', 'blue', 'purple', 'purple']
        },
    ];

    bossCollection: Array<object> = [
        {
            "bossname": "Baby-Barbar",
            "tokens": ['red', 'red', 'green', 'green', 'purple', 'purple', 'purple']
        },
        {
            "bossname": "Der Flecken-Schrecken",
            "tokens": ['blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'yellow', 'yellow', 'yellow' ]
        },
        {
            "bossname": "Zola, die Gorgone",
            "tokens": ['red', 'red', 'red', 'red', 'yellow', 'yellow', 'yellow', 'purple', 'purple', 'purple']
        },
        {
            "bossname": "Verdammt, ein Drache!!!",
            "tokens": ['red', 'yellow', 'purple', 'purple', 'purple', 'purple', 'green', 'green', 'green', 'green', 'green', 'green']
        },
        {
            "bossname": "Der Dungeon-Overlord",
            "tokens": ['red', 'red', 'red', 'green', 'green', 'green', 'yellow', 'yellow', 'yellow', 'blue', 'blue', 'blue']
        },
    ];

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
            "tokens": ['yellow', 'yellow', 'green'],
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
    ];

    shuffle(array:object[]) {
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
    };

    public toJSON() {
        return {
            monsterStack: this.monsterStack
        }

    };
}