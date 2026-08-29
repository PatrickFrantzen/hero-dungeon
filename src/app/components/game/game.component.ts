import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogChooseHeroComponent } from 'src/app/components/dialog-choose-hero/dialog-choose-hero.component';
import { User } from 'src/models/user.class';
import { Store } from '@ngxs/store';
import { CreateNewCardStackAction, UpdateCardStackAction } from 'src/app/actions/CardStack-action';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectors';
import { CurrentGameSelectors } from 'src/app/selectors/currentGame-selector';
import { CurrentCardsInHand } from 'src/app/actions/cardsInHand-action';
import { CurrentDeliveryStack } from 'src/app/actions/deliveryStack-action';
import { CurrentUserHeroAction } from 'src/app/actions/currentUser-action';
import { updateChoosenHeros } from 'src/app/actions/lobby-action';
import { EnemyContainerComponent } from '../enemy/enemy-container/enemy-container.component';
import { PlayerHandComponent } from '../player-hand/player-hand.component';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { PlayerRepositoryService } from 'src/app/services/player-repository.service';
import { ChooseHeroDialogResult } from 'src/app/components/dialog-results';

interface ChoosenPlayer {
  playerName: string;
  playerId: string;
  playerHero: string;
}

// OnPush: PlayerHandComponent no longer mutates plain fields from raw Firestore onSnapshot
// callbacks - it reads all state via store.selectSignal(), so the OnPush ancestor no longer
// blocks change detection from reaching it.
@Component({
    selector: 'app-game',
    templateUrl: './game.component.html',
    styleUrls: ['./game.component.scss'],
    imports: [EnemyContainerComponent, PlayerHandComponent],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameComponent implements OnInit {

  currentUserId = this.store.selectSignal(CurrentUserSelectors.currentUserId);
  currentUserName = this.store.selectSignal(CurrentUserSelectors.currentUserName);
  currentGameId = this.store.selectSignal(CurrentGameSelectors.currentGame);
  currentUserHeroData = this.store.selectSignal(CurrentUserSelectors.currentUserHeroData);

  loadError = signal<string | null>(null);

  user = new User();
  currentHero: Object = {};
  players: ChoosenPlayer[] = [];

  constructor(
    public dialog: MatDialog,
    private store: Store,
    private gameRepo: GameRepositoryService,
    private playerRepo: PlayerRepositoryService,
  ) { }

  ngOnInit(): void {
    this.checkIfPlayerIsAlreadyPartOfGame();
  }

  async checkIfPlayerIsAlreadyPartOfGame() {
    try {
      const data = await this.gameRepo.getGame(this.currentGameId());
      this.players = data?.['choosenHeros'] || [];
      const foundCurrentPlayer = this.players.some((player) => player.playerId === this.currentUserId());

      if (foundCurrentPlayer) {
        await this.loadHandstack(this.currentUserId());
      } else {
        await this.createNewPlayer();
        this.openDialog();
      }
    } catch {
      this.loadError.set('Das Spiel konnte nicht geladen werden. Bitte Seite neu laden oder später erneut versuchen.');
    }
  }

  async createNewPlayer() {
    await this.playerRepo.createPlayer(this.currentGameId(), this.currentUserId(), this.user.toJSON(), {
      userId: this.currentUserId(),
      userNickname: this.currentUserName(),
      gameId: this.currentGameId(),
    });
    this.store.dispatch(new CurrentDeliveryStack(this.user.deliveryStack));
  }

  async updatePlayerOfGame() {
    const playerData: ChoosenPlayer = {
      playerName: this.currentUserName(),
      playerId: this.currentUserId(),
      playerHero: this.currentUserHeroData().choosenHero,
    };
    this.players.push(playerData);
    await this.gameRepo.addPlayerToGame(this.currentGameId(), this.players);
    this.store.dispatch(new updateChoosenHeros(playerData));
  }

  async loadHandstack(currentPlayerId: string) {
    const data = await this.playerRepo.getPlayer(this.currentGameId(), currentPlayerId);
    this.store.dispatch(new CurrentCardsInHand(data?.['handstack']));
    this.store.dispatch(new CurrentDeliveryStack(data?.['deliveryStack']));
  }

  openDialog() {
    let dialogRef = this.dialog.open<DialogChooseHeroComponent, undefined, { data: ChooseHeroDialogResult }>(
      DialogChooseHeroComponent
    );

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) return;
      try {
        const { cardstack, heroname, heropower, description } = result.data.choosenHero;
        this.store.dispatch(new CreateNewCardStackAction(cardstack));
        this.store.dispatch(new CurrentUserHeroAction(heroname, heropower, description));
        await this.playerRepo.updatePlayerChoosenHero(this.currentGameId(), this.currentUserId(), result.data.choosenHero);
        await this.drawInitialHand();
        await this.updatePlayerOfGame();
      } catch {
        this.loadError.set('Der gewählte Held konnte nicht gespeichert werden. Bitte erneut versuchen.');
      }
    });
  }

  async drawInitialHand() {
    const data = await this.playerRepo.getPlayer(this.currentGameId(), this.currentUserId());
    const cardStack: string[] = data?.['choosenHero'].cardstack || [];
    const handstack: string[] = cardStack.splice(0, 5);
    this.store.dispatch(new CurrentCardsInHand(handstack));
    this.store.dispatch(new UpdateCardStackAction(cardStack));
    await this.playerRepo.updatePlayerCards(this.currentGameId(), this.currentUserId(), cardStack, handstack);
  }

}
