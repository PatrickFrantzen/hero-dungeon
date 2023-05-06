import { Card, CardStack } from "src/models/helden/card.class";

export class CreateNewCardStackAction {
static readonly type = '[Game page] Creating new Cardstack'
constructor(public cardstack: string[]) {}
}