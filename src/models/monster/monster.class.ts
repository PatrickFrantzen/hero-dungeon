export class Monster {
    public monsterStack: Array<object> = [];

    constructor() { }

    createMonsterStack(numberOfPlayers: number, currentBoss: any, difficulty: string) {
        if (currentBoss.bossname == 'Baby-Barbar') {
            if (difficulty == 'easy') {
                this.getMonsterForGame(numberOfPlayers, 10, 4, 12, 6, 14, 8, 16, 10);
            } else if (difficulty == 'medium') {
                this.getMonsterForGame(numberOfPlayers, 14, 4, 16, 6, 18, 8, 20, 10);
            } else {
                this.getMonsterForGame(numberOfPlayers, 18, 4, 20, 6, 22, 8, 24, 10);
            }
        } else if (currentBoss.bossname == 'Der Flecken-Schrecken') {
            if (difficulty == 'easy') {
                this.getMonsterForGame(numberOfPlayers, 14, 4, 16, 6, 18, 8, 20, 10);
            } else if (difficulty == 'medium')  {
                this.getMonsterForGame(numberOfPlayers, 18, 4, 20, 6, 22, 8, 24, 10);
            }else {
                this.getMonsterForGame(numberOfPlayers, 22, 4, 24, 6, 26, 8, 28, 10);
            }
        } else if (currentBoss.bossname == 'Zola, die Gorgone') {
            if (difficulty == 'easy') {
                this.getMonsterForGame(numberOfPlayers, 18, 4, 20, 6, 22, 8, 24, 10);
            } else if (difficulty == 'medium')  {
                this.getMonsterForGame(numberOfPlayers, 22, 4, 24, 6, 26, 8, 28, 10);
            }else {
                this.getMonsterForGame(numberOfPlayers, 26, 4, 28, 6, 30, 8, 32, 10);
            }
        } else if (currentBoss.bossname == 'Verdammt, ein Drache!!!') {
            if (difficulty == 'easy') {
                this.getMonsterForGame(numberOfPlayers, 22, 4, 24, 6, 26, 8, 28, 10);
            } else if (difficulty == 'medium')  {
                this.getMonsterForGame(numberOfPlayers, 26, 4, 28, 6, 30, 8, 32, 10);
            }else {
                this.getMonsterForGame(numberOfPlayers, 30, 4, 32, 6, 34, 8, 36, 10);
            }
        } else {
            if (difficulty == 'easy') {
                this.getMonsterForGame(numberOfPlayers, 26, 4, 28, 6, 30, 8, 32, 10);
            } else if (difficulty == 'medium')  {
                this.getMonsterForGame(numberOfPlayers, 30, 4, 32, 6, 34, 8, 36, 10);
            }else {
                this.getMonsterForGame(numberOfPlayers, 34, 4, 36, 6, 38, 8, 40, 10);
            }
        }
        return this.monsterStack
    }

    getMonsterForGame(numberOfPlayers: number, monsterTwo: number, questTwo: number, monsterThree: number, questThree: number,
        monsterFour: number, questFour: number, monsterFive: number, questFive: number) {
        switch (numberOfPlayers) {
            case 2:
                this.loadMonster(monsterTwo);
                this.loadQuests(questTwo);
                break;
            case 3:
                this.loadMonster(monsterThree);
                this.loadQuests(questThree);
                break;
            case 4:
                this.loadMonster(monsterFour);
                this.loadQuests(questFour);
                break;
            case 5:
                this.loadMonster(monsterFive);
                this.loadQuests(questFive);
                break;
            default:
                break;
        }
        this.shuffle(this.monsterStack);
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
            "name": "Feindselige Riesenkrabbe",
            "type": "Mini-Boss",
            "token": ['green', 'green', 'green', 'yellow', 'yellow', 'yellow']
        },
        {
            "name": "Ein Bonsai-T-Rex",
            "type": "Mini-Boss",
            "token": ['yellow', 'yellow', 'green', 'green', 'red', 'red']
        },
        {
            "name": "Der Sammler",
            "type": "Mini-Boss",
            "token": ['yellow', 'green', 'red', 'blue', 'purple']
        },
        {
            "name": "Plötzliche Krankheit",
            "type": "Jeder legt alle Handkarten auf den eigenen Ablagestapel.",
            "token": ['']
        },
        {
            "name": "Chaos",
            "type": "Jeder gibt seine Handkarten einem Mitspieler.",
            "token": ['']
        },
        {
            "name": "Ein Wehweh",
            "type": "Jeder legt 1 Karte auf den eigenen Ablagestapel.",
            "token": ['']
        },
        {
            "name": "Hinterhalt",
            "type": "Deckt 2 Karten aus dem Dungeon auf. Ihr müsst beide besiegen, bevor es weitergeht.",
            "token": ['']
        },
        {
            "name": "Falltür",
            "type": "Jeder legt 3 Karten auf den eigenen Ablagestapel.",
            "token": ['']
        },
        {
            "name": "Der Rattenkönig",
            "type": "Mini-Boss",
            "token": ['purple', 'purple', 'purple', 'red', 'red', 'red']
        },
        {
            "name": "Ein Zauberer mit schlechtem Ruf",
            "type": "Mini-Boss",
            "token": ['blue', 'blue', 'blue', 'blue', 'purple', 'purple']
        },
    ];

    bossCollection: Array<object> = [
        {
            "bossname": "Baby-Barbar",
            "token": ['red', 'red', 'green', 'green', 'purple', 'purple', 'purple'],
            "type": "Boss"
        },
        {
            "bossname": "Der Flecken-Schrecken",
            "token": ['blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'yellow', 'yellow', 'yellow'],
            "type": "Boss"
        },
        {
            "bossname": "Zola, die Gorgone",
            "token": ['red', 'red', 'red', 'red', 'yellow', 'yellow', 'yellow', 'purple', 'purple', 'purple'],
            "type": "Boss"
        },
        {
            "bossname": "Verdammt, ein Drache!!!",
            "token": ['red', 'yellow', 'purple', 'purple', 'purple', 'purple', 'green', 'green', 'green', 'green', 'green', 'green'],
            "type": "Boss"
        },
        {
            "bossname": "Der Dungeon-Overlord",
            "token": ['red', 'red', 'red', 'green', 'green', 'green', 'yellow', 'yellow', 'yellow', 'blue', 'blue', 'blue'],
            "type": "Boss"
        },
    ];

    monsterCollection: Array<object> = [
        {
            "name": "Treibsand",
            "token": ['purple', 'purple', 'yellow'],
            "type": "Hindernis"
        },
        {
            "name": "Unsichtbare Wand",
            "token": ['blue', 'blue'],
            "type": "Hindernis"
        },
        {
            "name": "Ein etwas unbequemer Stuhl",
            "token": ['red', 'purple', 'yellow'],
            "type": "Hindernis"
        },
        {
            "name": "Ein Rosetta-Stein-Golem",
            "token": ['purple', 'yellow'],
            "type": "Monster"
        },
        {
            "name": "Genau 26 Ninjas",
            "token": ['blue', 'purple', 'purple'],
            "type": "Person"
        },
        {
            "name": "William Duck I.",
            "token": ['blue', 'purple', 'yellow'],
            "type": "Monster"
        },
        {
            "name": "Eingestürzte Decke",
            "token": ['red', 'blue', 'blue'],
            "type": "Hindernis"
        },
        {
            "name": "Bodenloser Abgrund",
            "token": ['purple', 'purple'],
            "type": "Hindernis"
        },
        {
            "name": "Ein Ad-Hoc-Völkerballturnier",
            "token": ['purple', 'purple', 'green'],
            "type": "Hindernis"
        },
        {
            "name": "Der Karpaltunnel",
            "token": ['blue', 'green', 'green'],
            "type": "Hindernis"
        },
        {
            "name": "Zombies ohne Ende",
            "token": ['red', 'red', 'red'],
            "type": "Monster"
        },
        {
            "name": "Steve",
            "token": ['blue', 'purple', 'green'],
            "type": "Person"
        },
        {
            "name": "Knappe Nedward",
            "token": ['yellow', 'yellow', 'green'],
            "type": "Person"
        },
        {
            "name": "Eine Kriegerprinzessin",
            "token": ['yellow', 'green'],
            "type": "Person"
        },
        {
            "name": "Hai mit sexy Beinen!!",
            "token": ['red', 'green', 'green'],
            "type": "Monster"
        },
        {
            "name": "Eine 'Abkürzung'",
            "token": ['red', 'yellow', 'yellow'],
            "type": "Hindernis"
        },
        {
            "name": "Knuffiger Goblin",
            "token": ['red', 'purple'],
            "type": "Monster"
        },
        {
            "name": "Ein überteuerter Händler",
            "token": ['blue', 'blue', 'purple'],
            "type": "Person"
        },
        {
            "name": "Zombietusse",
            "token": ['red', 'green'],
            "type": "Monster"
        },
        {
            "name": "Ein Kaktus, der umarmen will",
            "token": ['yellow', 'yellow', 'yellow'],
            "type": "Monster"
        },
        {
            "name": "Ein aufrechter Geist",
            "token": ['blue', 'yellow'],
            "type": "Monster"
        },
        {
            "name": "Buchstäblich ein Strohmann",
            "token": ['red', 'blue', 'purple'],
            "type": "Hindernis"
        },
        {
            "name": "Ein Armhändler",
            "token": ['blue', 'green'],
            "type": "Person"
        },
        {
            "name": "Eine sicher sprengfallenfreie Truhe",
            "token": ['purple', 'yellow', 'yellow'],
            "type": "Hindernis"
        },
        {
            "name": "Ein Haufen schreiender Kinder",
            "token": ['red', 'yellow', 'green'],
            "type": "Person"
        },
        {
            "name": "Ein langsam ladender Bildschirm",
            "token": ['red', 'purple', 'green'],
            "type": "Hindernis"
        },
        {
            "name": "Lebendiges Grünzeug",
            "token": ['blue', 'blue', 'blue'],
            "type": "Hindernis"
        },
        {
            "name": "Sir Fuzzy",
            "token": ['purple', 'green', 'green'],
            "type": "Monster"
        },
        {
            "name": "Ein 'Geist', ja klar!",
            "token": ['red', 'red', 'green'],
            "type": "Person"
        },
        {
            "name": "Ein Timberwolf",
            "token": ['red', 'red'],
            "type": "Monster"
        },
        {
            "name": "Reizender Schleim",
            "token": ['purple', 'green'],
            "type": "Monster"
        },
        {
            "name": "Grozznak der Große",
            "token": ['purple', 'yellow', 'green'],
            "type": "Person"
        },
        {
            "name": "Eine lächerlich hohe Eiswand",
            "token": ['purple', 'purple', 'purple'],
            "type": "Hindernis"
        },
        {
            "name": "Gespickte Wand",
            "token": ['blue', 'blue', 'yellow'],
            "type": "Hindernis"
        },
        {
            "name": "Nur ein paar Stufen",
            "token": ['blue', 'purple'],
            "type": "Hindernis"
        },
        {
            "name": "Barb-Irrer",
            "token": ['red', 'red', 'yellow'],
            "type": "Person"
        },
        {
            "name": "ÖÖÖÖHHAA",
            "token": ['yellow', 'blue', 'yellow'],
            "type": "Monster"
        },
        {
            "name": "Typ mit massiven Schulterpanzern",
            "token": ['red', 'blue', 'red'],
            "type": "Person"
        },
        {
            "name": "7 Null-Bock-Zwerge",
            "token": ['red', 'blue', 'yellow'],
            "type": "Person"
        },
        {
            "name": "2 Mann, 1 Bogen",
            "token": ['green', 'yellow', 'green'],
            "type": "Person"
        }
    ];

    shuffle(array: object[]) {
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