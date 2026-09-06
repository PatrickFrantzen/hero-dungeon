import { inject, Injectable } from '@angular/core';
import { DocumentData, where } from '@angular/fire/firestore';
import { Store } from '@ngxs/store';
import { UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { UpdateCurrentHandAction } from 'src/app/actions/cardsInHand-action';
import { ResetGameTimer, UpdateGameStatus } from 'src/app/actions/currentGame-action';
import { SetCurrentBoss, SetNewEnemy, SetRemainingBosses } from 'src/app/actions/encounter-action';
import { UpdateDeliveryStack } from 'src/app/actions/deliveryStack-action';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { EncounterSelectors } from 'src/app/selectors/encounter-selector';
import { createHero } from 'src/models/helden/hero.class';
import { HERO_DEFINITIONS } from 'src/models/helden/hero-definitions';
import { Mob, Monster } from 'src/models/monster/monster.class';
import { startHandSize } from 'src/models/start-hand-size.util';
import { FirestoreRepositoryService } from './firestore-repository.service';
import { GameFactoryService } from './game-factory.service';
import { GameRepositoryService } from './game-repository.service';
import { PlayerRepositoryService } from './player-repository.service';

/**
 * Extrahiert aus `CardPlayService` (T5, Component-Refactoring-Audit) — "nächster Boss/Dungeon-
 * Übergang": Boss-Kampagne fortsetzen (`continueToNextDungeon`) bzw. nach einer Niederlage neu
 * starten (`restartCampaign`), inkl. dem dabei jeweils fälligen Neumischen aller Heldendecks
 * (`reshuffleAllPlayersForNewDungeon`), und der Übergang zum nächsten Encounter innerhalb eines
 * laufenden Dungeons (`getNextEnemy`/`getNextBoss`, aufgerufen von
 * `CardPlayService.checkForNextEnemy()`). Bewusst nicht angetastet: die fünf Zielspieler-
 * `resolve*()`-Methoden und die Nachzieh-/Handgrößen-Logik bleiben in `CardPlayService` — siehe
 * Analyse in der Session, die diesen Schnitt vorgeschlagen hat.
 */
@Injectable({
  providedIn: 'root',
})
export class DungeonProgressionService {
  private store = inject(Store);
  private gameRepo = inject(GameRepositoryService);
  private playerRepo = inject(PlayerRepositoryService);
  private repo = inject(FirestoreRepositoryService);
  private gameFactory = inject(GameFactoryService);

  private currentMob = this.store.selectSignal(EncounterSelectors.currentMob);
  private currentBoss = this.store.selectSignal(EncounterSelectors.currentBoss);
  private currentAllBosses = this.store.selectSignal(EncounterSelectors.currentAllBosses);
  private currentNumberOfPlayers = this.store.selectSignal(CurrentGameSelectors.currentNumberOfPlayers);
  private currentDifficulty = this.store.selectSignal(CurrentGameSelectors.currentDifficulty);

  /** Von GameComponent aufgerufen, nachdem ein Spieler nach besiegtem Boss (gameStatus
   * 'bossDefeated') bestätigt hat, mit dem nächsten Dungeon weiterzumachen (Anleitung S. 6):
   * nächster Boss aus der `allBosses`-Warteschlange, neuer Dungeon-Kartenstapel passend zu
   * Spielerzahl/Schwierigkeit, Timer zurückgesetzt, und - Anleitung S. 6 "Mischt die 40 Karten
   * eines jeden Helden-Decks für sich" - jeder Spieler bekommt sein Heldendeck frisch gemischt
   * und eine neue Starthand. */
  continueToNextDungeon(gameId: string, playerId: string): Promise<void> {
    const remainingBosses = [...this.currentAllBosses()];
    const nextBoss = remainingBosses.shift();
    if (!nextBoss) return Promise.resolve();

    const newMob = new Monster().createMob(this.currentNumberOfPlayers(), nextBoss.name, this.currentDifficulty());
    const newCurrentEnemy = newMob.shift()!;

    this.store.dispatch(new SetCurrentBoss(nextBoss));
    this.store.dispatch(new SetRemainingBosses(remainingBosses));
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    this.store.dispatch(new UpdateMobAction(newMob));
    this.store.dispatch(new ResetGameTimer());
    this.store.dispatch(new UpdateGameStatus('playing'));

    const writes = [
      this.gameRepo.updateCurrentBoss(gameId, nextBoss),
      this.gameRepo.updateRemainingBosses(gameId, remainingBosses),
      this.gameRepo.updateCurrentEnemyToken(gameId, newCurrentEnemy),
      this.gameRepo.updateNewMob(gameId, newMob),
      this.gameRepo.resetTimer(gameId),
      this.gameRepo.updateGameStatus(gameId, 'playing'),
      this.reshuffleAllPlayersForNewDungeon(gameId, playerId),
    ];

    return Promise.all(writes).then(() => undefined);
  }

  /** Von GameComponent aufgerufen, wenn ein Spieler nach verlorenem Dungeon (gameStatus 'lost')
   * einen Neustart bestätigt (Anleitung S. 7: "versucht euer Glück von neuem mit dem
   * Baby-Barbar") - baut den Dungeon wieder auf Boss #1 zurück und mischt wie
   * continueToNextDungeon() jedes Heldendeck frisch. */
  restartCampaign(gameId: string, playerId: string): Promise<void> {
    const freshGame = this.gameFactory.buildNewGame(this.currentNumberOfPlayers(), this.currentDifficulty(), gameId);

    this.store.dispatch(new SetCurrentBoss(freshGame.currentBoss));
    this.store.dispatch(new SetRemainingBosses(freshGame.allBosses));
    this.store.dispatch(new SetNewEnemy(freshGame.currentEnemy));
    this.store.dispatch(new UpdateMobAction(freshGame.Mob));
    this.store.dispatch(new ResetGameTimer());
    this.store.dispatch(new UpdateGameStatus('playing'));

    const writes = [
      this.gameRepo.updateCurrentBoss(gameId, freshGame.currentBoss),
      this.gameRepo.updateRemainingBosses(gameId, freshGame.allBosses),
      this.gameRepo.updateCurrentEnemyToken(gameId, freshGame.currentEnemy),
      this.gameRepo.updateNewMob(gameId, freshGame.Mob),
      this.gameRepo.resetTimer(gameId),
      this.gameRepo.updateGameStatus(gameId, 'playing'),
      this.reshuffleAllPlayersForNewDungeon(gameId, playerId),
    ];

    return Promise.all(writes).then(() => undefined);
  }

  /** Public: von `CardPlayService.checkForNextEnemy()` aufgerufen, wenn innerhalb des laufenden
   * Dungeons noch ein Encounter in der `Mob`-Warteschlange auf den besiegten Gegner folgt. */
  getNextEnemy(gameId: string): Promise<void> {
    const currMob = [...this.currentMob()];
    const newCurrentEnemy: Mob = currMob.shift()!;
    const writes = [this.gameRepo.updateCurrentEnemyToken(gameId, newCurrentEnemy), this.gameRepo.updateNewMob(gameId, currMob)];
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    this.store.dispatch(new UpdateMobAction(currMob));
    return Promise.all(writes).then(() => undefined);
  }

  /** Public: von `CardPlayService.checkForNextEnemy()` aufgerufen, wenn die `Mob`-Warteschlange
   * leer ist und als nächstes der Dungeon-Boss selbst ansteht. */
  getNextBoss(gameId: string): Promise<void> {
    const newCurrentEnemy: Mob = this.currentBoss();
    const write = this.gameRepo.updateCurrentEnemyToken(gameId, newCurrentEnemy);
    this.store.dispatch(new SetNewEnemy(newCurrentEnemy));
    return write;
  }

  private async reshuffleAllPlayersForNewDungeon(gameId: string, actingPlayerId: string): Promise<void> {
    const players = await this.repo.queryAll<DocumentData>(['games', gameId, 'player'], [where('gameId', '==', gameId)]);
    const numberOfPlayers = this.currentNumberOfPlayers();
    const useExtraDeck = numberOfPlayers === 1 || numberOfPlayers === 2;
    await Promise.all(
      players.map((data) => this.reshufflePlayerHeroDeck(gameId, data, data['userId'] === actingPlayerId, useExtraDeck))
    );
  }

  private reshufflePlayerHeroDeck(gameId: string, data: DocumentData, isActingPlayer: boolean, useExtraDeck: boolean): Promise<void> {
    const userId = data['userId'];
    const heroName = data['choosenHero']?.heroname;
    const heroDefinition = HERO_DEFINITIONS.find((def) => def.heroName === heroName);
    if (!heroDefinition) return Promise.resolve();

    const hero = createHero(heroDefinition.id, useExtraDeck);
    const hand = hero.cardstack.splice(0, startHandSize(this.currentNumberOfPlayers()));

    const writes = [
      this.playerRepo.updateHandstack(gameId, userId, hand),
      this.playerRepo.updateCardstack(gameId, userId, hero.cardstack),
      this.playerRepo.updateDeliveryStack(gameId, userId, []),
    ];

    if (isActingPlayer) {
      this.store.dispatch(new UpdateCurrentHandAction(hand));
      this.store.dispatch(new UpdateCardStackAction(hero.cardstack));
      this.store.dispatch(new UpdateDeliveryStack([]));
    }

    return Promise.all(writes).then(() => undefined);
  }
}
