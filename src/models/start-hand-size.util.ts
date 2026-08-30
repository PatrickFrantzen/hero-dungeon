/**
 * Start-Handgröße laut Anleitung (S. 2): 2 Spieler -> 5 Karten, 3 Spieler -> 4 Karten,
 * 4-5 Spieler -> 3 Karten. Der Singleplayer-Modus (1 Spieler) ist keine Regel aus der
 * Originalanleitung, behält aber die bisherige Handgröße von 5 Karten bei.
 */
export function startHandSize(numberOfPlayers: number): number {
    if (numberOfPlayers <= 2) return 5;
    if (numberOfPlayers === 3) return 4;
    return 3;
}
