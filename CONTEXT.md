# Domain Context

## Glossary

### Singleplayer-Modus

Ein Spielmodus für genau einen menschlichen Spieler. Der Spieler startet ohne Lobby-Gefühl, wählt einen Helden und spielt den Dungeon-Loop allein bis zum Boss `Baby-Barbar`.

### Singleplayer-Held

Ein Held, dessen Kartenstapel und Heldenfähigkeit im Solo-Spiel sinnvoll funktionieren. `Dieb` und `Waldläufer` sind die bevorzugten Singleplayer-Helden.

### Nicht empfohlener Singleplayer-Held

Ein Held, dessen Fähigkeit wesentlich von Multiplayer-Situationen abhängt oder im Solo-Spiel wenig Bedeutung hat. `Magier` und `Walküre` sollen im Singleplayer nicht als primäre Empfehlung erscheinen.

### Dungeon-Loop

Die Abfolge aus aktuellem Encounter anzeigen, passende Handkarte spielen, Encounter-Token entfernen, Hand nachziehen und nach besiegtem Encounter den nächsten normalen Encounter laden. Im Singleplayer besteht der normale Dungeon vor dem Boss aus 5 normalen Monstern und 1 Event.

### Deck-Cycling

Die Solo-Regel, die verhindert, dass der Spieler dead-locked, wenn keine passende Karte mehr erreichbar ist. Im Singleplayer muss es einen Mechanismus geben, der den Ablagestapel wieder ins Deck zurückführt oder anderweitig Kartenwechsel erlaubt.

### Deadlock

Ein Spielzustand, in dem der Spieler keine passende Handkarte spielen kann und nicht mehr sinnvoll durch sein Deck kommt. Der Singleplayer-Modus muss Deadlocks aktiv vermeiden.

### Boss-Finale

Der Endabschnitt eines Singleplayer-Runs. Wenn der normale Mob-Stapel leer ist, erscheint `Baby-Barbar` als Boss. Nach besiegtem `Baby-Barbar` endet der Run mit einem Siegzustand.
