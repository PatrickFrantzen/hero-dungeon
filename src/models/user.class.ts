// FieldValue deckt serverTimestamp() ab (siehe GameRepositoryService/PlayerRepositoryService),
// Timestamp den bereits aus Firestore gelesenen Wert - der Typ-Import kommt bewusst aus dem
// Firebase-Core-SDK (nicht "@angular/fire"), damit dieses reine Datenmodell kein Angular-Detail
// referenziert.
import type { FieldValue, Timestamp } from 'firebase/firestore';

export class User {
    public userId:string = '';
    // Anonyme Multiplayer-Accounts (Issue #76, signInAnonymously()) haben keine E-Mail -
    // optional statt eines '' -Platzhalters, damit toJSON() das Feld für sie ganz weglassen
    // kann (Firestore lehnt ein explizites `undefined`-Feld ab).
    public userEmail?: string;
    public userNickname:string = '';
    public choosenHero:Object = {};
    public handstack: string[] = [];
    public deliveryStack: string[] = [];
    // Letzte Spielaktivität - Grundlage für die 7-Tage-TTL-Policy auf anonyme Multiplayer-
    // Accounts (docs/done/login-multiplayer-onboarding-plan.md, PR 5). Muss beim Schreiben
    // ein Firestore serverTimestamp() sein, kein number/Epoch, siehe dortige Begründung.
    public lastActivityAt: Timestamp | FieldValue | null = null;

    constructor(obj? : { userId: string, userEmail?: string, userNickname: string, choosenHero: Object, handstack: string[], deliveryStack: string[], lastActivityAt?: Timestamp | FieldValue | null }) {
        this.userId = obj?.userId || '';
        this.userEmail = obj?.userEmail;
        this.userNickname = obj?.userNickname || '';
        this.choosenHero = obj?.choosenHero || {};
        this.handstack = obj?.handstack || [];
        this.deliveryStack = obj?.deliveryStack || [];
        this.lastActivityAt = obj?.lastActivityAt ?? null;
    }

    public toJSON() {
        const json: Record<string, unknown> = {
            userId: this.userId,
            userNickname: this.userNickname,
            choosenHero: this.choosenHero,
            handstack: this.handstack,
            deliveryStack: this.deliveryStack,
            lastActivityAt: this.lastActivityAt,
        };
        if (this.userEmail !== undefined) {
            json['userEmail'] = this.userEmail;
        }
        return json;
    }
}