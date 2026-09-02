import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogGameSettingsComponent } from '../dialog-game-settings/dialog-game-settings.component';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngxs/store';
import { CurrentUserSelectors } from 'src/app/selectors/currentUser-selectors';
import { CurrentUserService } from 'src/app/services/current-user.service';
import { CurrentGameAction, CurrentGameData } from 'src/app/actions/currentGame-action';
import { SetNewEnemy } from 'src/app/actions/encounter-action';
import { ToJSONService } from 'src/app/services/to-json.service';
import { CreateNewMobAction, UpdateMobAction } from 'src/app/actions/MonsterStack-action';
import { GameFactoryService } from 'src/app/services/game-factory.service';
import { GameRepositoryService } from 'src/app/services/game-repository.service';
import { GameSettingsDialogResult } from 'src/app/components/dialog-results';

@Component({
    selector: 'app-startscreen',
    templateUrl: './startscreen.component.html',
    styleUrls: ['./startscreen.component.scss'],
    imports: [FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StartscreenComponent implements OnInit {
  currentGameId: string = '';
  joinGameId: string = '';
  startscreenError: string | null = null;

  currentUserId = this.store.selectSignal(CurrentUserSelectors.currentUserId);
  currentUserName = this.store.selectSignal(CurrentUserSelectors.currentUserName);

  constructor(
    public dialog:MatDialog,
    public auth: Auth,
    private route: Router,
    private userService: CurrentUserService,
    private store: Store,
    private JSON: ToJSONService,
    private gameFactory: GameFactoryService,
    private gameRepo: GameRepositoryService
  ) {}


  ngOnInit(): void {
    if (!this.currentUserName()) {
      this.userService.getCurrentUser()
    }
  }

  newGame() {
      this.openDialog(false);
  }

  newSingleplayerGame() {
      this.openDialog(true);
  }

  openDialog(singleplayerMode = false) {
    let dialogRef = this.dialog.open<DialogGameSettingsComponent, { singleplayerMode: boolean }, { data: GameSettingsDialogResult }>(
      DialogGameSettingsComponent,
      // disableClose: ohne Auswahl (Schwierigkeit ist zwar vorbelegt, Spiele-ID/Spielerzahl
      // aber nicht) durfte der Dialog vorher per Backdrop-Klick/Escape verschwinden, ohne dass
      // ein Spiel erstellt wurde - wirkte wie ein Bug ("Klick geht ins Leere").
      { data: { singleplayerMode }, disableClose: true }
    );

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result?.data) {
        return;
      }
      const { numberOfPlayer, difficulty, gameId } = result.data;
      await this.createGame(numberOfPlayer, difficulty, gameId);
    });
  }

  private async createGame(numberOfPlayer: number, difficulty: string, gameId: string) {
    const game = this.gameFactory.buildNewGame(numberOfPlayer, difficulty, gameId);

    this.currentGameId = gameId;
    this.store.dispatch(new CurrentGameAction(gameId));
    this.store.dispatch(new CurrentGameData(game));
    this.store.dispatch(new CreateNewMobAction(game.Mob));

    try {
      await this.gameRepo.createGame(gameId, this.JSON.gameToJSON(game));
      this.route.navigate(['/game/' + gameId]);
    } catch {
      this.startscreenError = 'Das Spiel konnte nicht erstellt werden. Bitte erneut versuchen.';
    }
  }

  logout() {
    signOut(this.auth)
    .then (()=> {
      this.route.navigate(['signIn'])
    })
  }

  joinGame() {
    const inputValue = this.joinGameId.trim();
    if (!inputValue) {
      return;
    }
    this.gameRepo.getGame(inputValue)
    .then((results)=> {
      if (!results) {
        this.startscreenError = 'Kein Spiel mit dieser ID gefunden.';
        return;
      }
      this.startscreenError = null;
      this.store.dispatch(new SetNewEnemy(results['currentEnemy']));
      this.store.dispatch(new UpdateMobAction(results['Mob']));
      this.route.navigate(['/game/'+ inputValue]);
      this.store.dispatch(new CurrentGameAction(inputValue));
    })
    .catch(() => {
      this.startscreenError = 'Kein Spiel mit dieser ID gefunden.';
    })
  }
}
